import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Toolbar from "@mui/material/Toolbar";

   
                         
   
export default function Navigator(props) {
                                             
  const memus = [];
  return (
    <Drawer {...props}>
      <Toolbar variant="dense" />
      <List component="nav">
        {memus.map(() => null)}
      </List>
    </Drawer>
  );
}
