/* eslint-disable */
import React from "react";

interface Props {
  worldOrSomething: string;
}

const SimpleTypescriptGreeter: React.FC<Props> = ({ worldOrSomething }) => (
  <h2>{worldOrSomething}</h2>
);

export default SimpleTypescriptGreeter;
/* eslint-enable */
