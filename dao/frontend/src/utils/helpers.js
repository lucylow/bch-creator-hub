import { ethers } from "ethers";

export function proposalStateLabel(state) {
  // OpenZeppelin Governor states: 0:Pending,1:Active,2:Cancelled,3:Defeated,4:Succeeded,5:Queued,6:Expired,7:Executed
  const map = {
    0: "Pending",
    1: "Active",
    2: "Canceled",
    3: "Defeated",
    4: "Succeeded",
    5: "Queued",
    6: "Expired",
    7: "Executed"
  };
  return map[state] ?? `Unknown(${state})`;
}

export function descriptionHash(description) {
  return ethers.utils.id(description);
}



