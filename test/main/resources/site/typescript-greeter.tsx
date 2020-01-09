import React from "react";

import WorldGreeter from "../react4xp/shared-comps/redux-world-greeter";

interface Props {
  name: string;
}

const Greeter: React.FC<Props> = ({ name, ...rest }) => (
  <WorldGreeter name={name} {...rest} />
);
export default Greeter;
