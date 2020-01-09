import { combineReducers } from "redux";

import greetingsReducer from "./greetings-red";

export default combineReducers({
  greetings: greetingsReducer
});
