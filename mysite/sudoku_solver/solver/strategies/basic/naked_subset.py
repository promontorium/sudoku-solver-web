from itertools import chain, combinations
from typing import Iterable

from ... import Container, Grid
from ..exceptions import StrategyException
from .basic_strategy import BasicStrategy


class NakedSubset(BasicStrategy):
    """Naked pair/triple/quadruple"""

    def __init__(self, grid: Grid, subset_length: int):
        super().__init__(grid)
        self._subset_length = subset_length
        if self._subset_length not in (2, 3, 4):
            raise StrategyException(f"{self}: unexpected subset length {self._subset_length}")

    def __str__(self) -> str:
        return f"Naked {self._SUBSET_NAME.get(self._subset_length, 'SUBSET')}"

    def _get_base_containers(self) -> Iterable[Container]:
        for cont in chain(self._grid.rows, self._grid.columns, self._grid.boxes):
            if len(tuple(cont.filter_cells(solved=False))) > self._subset_length:
                yield cont

    def _solve_container(self, container: Container) -> bool:
        cand_cells_map = self._get_candidate_cells_map(container, min_cells=2)
        for cands in combinations(cand_cells_map, self._subset_length):
            # Cells that have at least one combination candidate
            cells = {cell for cand in cands for cell in cand_cells_map[cand]}
            # Cells that have only subset candidates
            naked_subset_cells = [cell for cell in cells if not cell.candidates - set(cands)]
            # Main rule: N cells share same N candidates
            if len(naked_subset_cells) != self._subset_length:
                continue
            # Cells outside naked subset with at least one combination candidate
            affected_cells = cells - set(naked_subset_cells)
            if not affected_cells:
                continue
            self._logger.info(
                "%s: %s. Base: %s %s. Affected: %s", self, cands, container, naked_subset_cells, affected_cells
            )
            for cell in affected_cells:
                cell.candidates -= set(cands)
            return True
        return False
