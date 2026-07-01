import { createContext, useContext } from 'react';

const ApprovedActionsContext = createContext({ approved: {}, toggle: () => {} });

export function useApprovedActions() {
  return useContext(ApprovedActionsContext);
}

export default ApprovedActionsContext;
