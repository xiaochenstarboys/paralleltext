import { getBatchQueue } from "./batchQueue";

let queueId = 0;
const createBatchQueue = (taskFn, options) =>
  getBatchQueue(`batch-queue-test-${queueId++}`, taskFn, options);

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const flushQueueScheduling = async () => {
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await flushPromises();
};

describe("BatchQueue individual cancellation", () => {
  test("cancelling one paragraph keeps the shared request alive for another", async () => {
    const pending = deferred();
    const taskFn = jest.fn(() => pending.promise);
    const queue = createBatchQueue(taskFn, { batchSize: 2 });
    const firstController = new AbortController();
    const first = queue.addTask("first", { signal: firstController.signal });
    const second = queue.addTask("second");
    const rejected = expect(first).rejects.toHaveProperty("name", "AbortError");
    firstController.abort();
    await rejected;
    expect(taskFn.mock.calls[0][1].signal.aborted).toBe(false);
    pending.resolve(["ignored", "second result"]);
    await expect(second).resolves.toBe("second result");
    queue.destroy();
  });

  test("cancelling all consumers aborts the shared HTTP request", async () => {
    const pending = deferred();
    const taskFn = jest.fn(() => pending.promise);
    const queue = createBatchQueue(taskFn, { batchSize: 2 });
    const a = new AbortController(), b = new AbortController();
    const first = queue.addTask("a", { signal: a.signal });
    const second = queue.addTask("b", { signal: b.signal });
    const expectations = [expect(first).rejects.toHaveProperty("name", "AbortError"), expect(second).rejects.toHaveProperty("name", "AbortError")];
    a.abort(); b.abort();
    await Promise.all(expectations);
    expect(taskFn.mock.calls[0][1].signal.aborted).toBe(true);
    pending.reject(new DOMException("Aborted", "AbortError"));
    await flushPromises();
    queue.destroy();
  });

  test("queued cancelled work never reaches the network", async () => {
    jest.useFakeTimers();
    const taskFn = jest.fn();
    const queue = createBatchQueue(taskFn, { batchSize: 10, batchInterval: 50 });
    const controller = new AbortController();
    const task = queue.addTask("cancelled", { signal: controller.signal });
    const rejected = expect(task).rejects.toHaveProperty("name", "AbortError");
    controller.abort();
    await rejected;
    jest.advanceTimersByTime(100);
    expect(taskFn).not.toHaveBeenCalled();
    queue.destroy();
    jest.useRealTimers();
  });
});

describe("BatchQueue batch concurrency", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("keeps batches serial when batchConcurrency is 1", async () => {
    const batches = [deferred(), deferred()];
    const taskFn = jest
      .fn()
      .mockImplementationOnce(() => batches[0].promise)
      .mockImplementationOnce(() => batches[1].promise);
    const queue = createBatchQueue(taskFn, {
      batchSize: 1,
      batchConcurrency: 1,
    });

    const first = queue.addTask("first");
    const second = queue.addTask("second");

    expect(taskFn).toHaveBeenCalledTimes(1);
    batches[0].resolve([["一", ""]]);
    await expect(first).resolves.toEqual(["一", ""]);
    await flushQueueScheduling();
    expect(taskFn).toHaveBeenCalledTimes(2);

    batches[1].resolve([["二", ""]]);
    await expect(second).resolves.toEqual(["二", ""]);
  });

  test("starts up to the configured number of batches", async () => {
    const batches = [deferred(), deferred(), deferred()];
    const taskFn = jest
      .fn()
      .mockImplementationOnce(() => batches[0].promise)
      .mockImplementationOnce(() => batches[1].promise)
      .mockImplementationOnce(() => batches[2].promise);
    const queue = createBatchQueue(taskFn, {
      batchSize: 1,
      batchConcurrency: 2,
    });

    const first = queue.addTask("first");
    const second = queue.addTask("second");
    const third = queue.addTask("third");

    expect(taskFn).toHaveBeenCalledTimes(2);
    batches[1].resolve([["二", ""]]);
    await expect(second).resolves.toEqual(["二", ""]);
    await flushQueueScheduling();
    expect(taskFn).toHaveBeenCalledTimes(3);

    batches[0].resolve([["一", ""]]);
    batches[2].resolve([["三", ""]]);
    await expect(first).resolves.toEqual(["一", ""]);
    await expect(third).resolves.toEqual(["三", ""]);
  });

  test("releases a concurrency slot when a batch fails", async () => {
    const batches = [deferred(), deferred()];
    const error = new Error("batch failed");
    const taskFn = jest
      .fn()
      .mockImplementationOnce(() => batches[0].promise)
      .mockImplementationOnce(() => batches[1].promise);
    const queue = createBatchQueue(taskFn, {
      batchSize: 1,
      batchConcurrency: 1,
    });

    const failed = queue.addTask("failed");
    const next = queue.addTask("next");
    const failedExpectation = expect(failed).rejects.toThrow("batch failed");

    batches[0].reject(error);
    await failedExpectation;
    await flushQueueScheduling();
    expect(taskFn).toHaveBeenCalledTimes(2);

    batches[1].resolve([["继续", ""]]);
    await expect(next).resolves.toEqual(["继续", ""]);
  });

  test("holds a slot until an async generator finishes", async () => {
    const generatorGate = deferred();
    const nextBatch = deferred();
    const taskFn = jest
      .fn()
      .mockImplementationOnce(async function* firstGenerator() {
        yield { id: 0, result: ["完成", ""] };
        await generatorGate.promise;
      })
      .mockImplementationOnce(() => nextBatch.promise);
    const queue = createBatchQueue(taskFn, {
      batchSize: 1,
      batchConcurrency: 1,
    });

    const first = queue.addTask("first");
    const second = queue.addTask("second");

    await expect(first).resolves.toEqual(["完成", ""]);
    expect(taskFn).toHaveBeenCalledTimes(1);

    generatorGate.resolve();
    await flushQueueScheduling();
    expect(taskFn).toHaveBeenCalledTimes(2);

    nextBatch.resolve([["下一批", ""]]);
    await expect(second).resolves.toEqual(["下一批", ""]);
  });

  test("waits for batchInterval when a batch is not full", async () => {
    jest.useFakeTimers();
    const taskFn = jest.fn().mockResolvedValue([["完成", ""]]);
    const queue = createBatchQueue(taskFn, {
      batchInterval: 100,
      batchSize: 2,
      batchConcurrency: 2,
    });

    const task = queue.addTask("only");
    jest.advanceTimersByTime(99);
    expect(taskFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flushPromises();
    expect(taskFn).toHaveBeenCalledTimes(1);
    await expect(task).resolves.toEqual(["完成", ""]);
  });

  test("keeps task results isolated when concurrent batches finish out of order", async () => {
    const firstBatch = deferred();
    const secondBatch = deferred();
    const taskFn = jest
      .fn()
      .mockImplementationOnce(() => firstBatch.promise)
      .mockImplementationOnce(() => secondBatch.promise);
    const queue = createBatchQueue(taskFn, {
      batchSize: 2,
      batchConcurrency: 2,
    });

    const results = [
      queue.addTask("a"),
      queue.addTask("b"),
      queue.addTask("c"),
      queue.addTask("d"),
    ];
    expect(taskFn).toHaveBeenCalledTimes(2);

    secondBatch.resolve([
      ["C", ""],
      ["D", ""],
    ]);
    firstBatch.resolve([
      ["A", ""],
      ["B", ""],
    ]);

    await expect(Promise.all(results)).resolves.toEqual([
      ["A", ""],
      ["B", ""],
      ["C", ""],
      ["D", ""],
    ]);
  });
});
