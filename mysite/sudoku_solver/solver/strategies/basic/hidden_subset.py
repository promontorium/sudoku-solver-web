from itertools import chain, combinations
from typing import Iterable

from ... import Container, Grid
from ..exceptions import StrategyException
from .basic_strategy import BasicStrategy


class HiddenSubset(BasicStrategy):
    """Hidden pair/triple/quadruple"""

    def __init__(self, grid: Grid, subset_length: int):
        super().__init__(grid)
        self._subset_length = subset_length
        if self._subset_length not in (2, 3, 4):
            raise StrategyException(f"{self}: unexpected subset length {self._subset_length}")

    def __str__(self) -> str:
        return f"Hidden {self._SUBSET_NAME.get(self._subset_length, 'SUBSET')}"

    def _get_base_containers(self) -> Iterable[Container]:
        for cont in chain(self._grid.rows, self._grid.columns, self._grid.boxes):
            if len(tuple(cont.filter_cells(solved=False))) > self._subset_length:
                yield cont

    def _solve_container(self, container: Container) -> bool:
        cand_cells_map = self._get_candidate_cells_map(container, min_cells=2, max_cells=self._subset_length)
        for cands in combinations(cand_cells_map, self._subset_length):
            # Cells that have at least one combination candidate
            cells = {cell for cand in cands for cell in cand_cells_map[cand]}
            # Main rule: N candidates appers only in N cells
            if len(cells) != self._subset_length:
                continue
            # Subset cells with additional candidates
            affected_cells = [cell for cell in cells if cell.candidates - set(cands)]
            if not affected_cells:
                continue
            self._logger.info("%s: %s. Base: %s %s. Affected: %s", self, cands, container, cells, affected_cells)
            for cell in affected_cells:
                cell.candidates &= set(cands)
            return True
        return False
