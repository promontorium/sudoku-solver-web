from abc import abstractmethod
from typing import Iterable

from ..sudoku import Container, Grid
from .strategy import Strategy


class BasicStrategy(Strategy):
    def __init__(self, grid: Grid):
        super().__init__(grid)
        self._SUBSET_NAME = {2: "pair", 3: "triple", 4: "quadruple"}

    @abstractmethod
    def _get_base_containers(self) -> Iterable[Container]:
        pass

    @abstractmethod
    def _solve_container(self, container: Container) -> bool:
        pass

    def solve(self) -> bool:
        return any(self._solve_container(cont) for cont in self._get_base_containers())
