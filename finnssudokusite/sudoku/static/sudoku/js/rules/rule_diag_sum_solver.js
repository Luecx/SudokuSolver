

export function attachDiagSumSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
   
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
   
        return changed;
    };

    instance.checkPlausibility = function (board) {
     
        return true;
    };
}
