from abc import abstractmethod
from typing import Iterable

from ... import Cell, Container, Grid
from ..exceptions import StrategyException
from ..strategy import Strategy


class MultiContainersStrategy(Strategy):
    def __init__(self, grid: Grid, subset_length: int):
        super().__init__(grid)
        self._subset_length = subset_length
        if self._subset_length < 2:
            raise StrategyException(f"{self}: unexpected subset length {self._subset_length}")

    @abstractmethod
    def _get_containers_subsets(self) -> Iterable[tuple[str, Iterable[Container]]]: ...

    @abstractmethod
    def _solve_cell_subsets(self, containers_type: str, candidate: int, cells_subsets: list[set[Cell]]) -> bool: ...

    def solve(self) -> bool:
        for conts_type, conts in self._get_containers_subsets():
            cand_subsets_map = self._get_cand_subsets_map(conts)
            for cand, subsets in cand_subsets_map.items():
                if self._solve_cell_subsets(conts_type, cand, subsets):
                    return True
        return False

    def _get_cand_subsets_map(self, containers: Iterable[Container]) -> dict[int, list[set[Cell]]]:
        result: dict[int, list[set[Cell]]] = {}
        for cont in containers:
            cand_cells_map = self._get_candidate_cells_map(cont, min_cells=2, max_cells=self._subset_length)
            for cand, cells in cand_cells_map.items():
                if cand not in result:
                    result[cand] = []
                result[cand].append(set(cells))
        return {cand: subsets for cand, subsets in result.items() if len(subsets) >= self._subset_length}
