from logging import getLogger

from ..sudoku import Cell, Grid
from .hidden_single import HiddenSingle
from .naked_single import NakedSingle


class BruteForcer:
    def __init__(self, grid: Grid):
        self._logger = getLogger(__name__)
        self._grid = Grid([cell.value if cell.is_given else 0 for cell in grid.cells])
        self._grid.init_candidates()
        self._force_restore = False
        self._restore_points: list[tuple[frozenset[int], tuple[tuple[Cell, tuple[int, frozenset[int]]], ...]]] = []
        self._solvers = (NakedSingle(self._grid), HiddenSingle(self._grid))

    def __str__(self) -> str:
        return "Brute forcer"

    def create_solution(self) -> str | None:
        self._logger.info("%s: Creating solution for %s", self, self._grid)
        if not self._grid.is_consistent:
            self._logger.warning("%s: %s is inconsistent", self, self._grid)
            return None
        force_restore = self._force_restore
        self._force_restore = True
        if not self._solve(force_restore):
            self._logger.warning("%s: Solution not found for %s", self, self._grid)
            return None
        self._logger.info("%s: Solution found for %s", self, self._grid)
        return "".join(str(cell.value) for cell in self._grid.cells)

    def reset(self) -> None:
        if not self._force_restore:
            self._logger.info("%s: Nothing to reset", self)
            return
        self._logger.info("%s: Resetting", self)
        self._grid.reset()
        self._grid.init_candidates()
        self._force_restore = False
        self._restore_points.clear()

    def _solve(self, force_restore: bool) -> bool:
        if force_restore:
            cands = self._restore()
            if not cands:
                return False
            self._make_prediction(candidates=cands)
        step = 0
        while not self._grid.is_solved:
            step += 1
            self._logger.debug("%s: Step=%d. Restore points: %d", self, step, len(self._restore_points))
            if any(self._grid.filter_cells(solved=False, candidates=frozenset())):
                cands = self._restore()
                if not cands:
                    return False
                self._make_prediction(candidates=cands)
            elif not any(solver.solve() for solver in self._solvers):
                self._make_prediction()
        self._logger.info("%s: Total steps %d. Restore points: %d", self, step, len(self._restore_points))
        return bool(step)

    def _make_prediction(self, *, candidates: frozenset[int] | None = None) -> None:
        cell = next(self._grid.filter_cells(solved=False))
        cands = candidates or cell.candidates
        value = next(iter(cands))
        cands -= {value}
        if cands:
            state = tuple((cell, cell.get_state()) for cell in self._grid.filter_cells(solved=False))
            self._restore_points.append((cands, state))
            self._logger.debug("%s: Restore point [%d]: %s %s", self, len(self._restore_points), cell, cands)
        self._logger.debug("%s: %s %s = %d. Remaining: %s", self, cell, cell.candidates, value, cands)
        self._grid.set_value(cell, value)

    def _restore(self) -> frozenset[int] | None:
        """Returns restored version candidates"""
        if not self._restore_points:
            self._logger.debug("%s: No restore points found", self)
            return None
        self._logger.debug("%s: Restoring [%d]", self, len(self._restore_points))
        cands, state = self._restore_points.pop()
        for cell, version in state:
            cell.restore(version)
        return cands
