from typing import Iterable

from ... import Cell
from .wing_strategy import WingStrategy


class XYZWing(WingStrategy):
    """Like Y-Wing but pivot contains pincers shared candidate.
    Consequently candidate can only be eliminated from cells that see not only the pincers, but the pivot as well
    """

    def __str__(self) -> str:
        return "XYZ-Wing"

    def _get_pivot_cands_count(self) -> int:
        return 3

    def _get_base_cells(self, pivot: Cell, pincers: tuple[Cell, Cell]) -> Iterable[Cell]:
        return (pivot, *pincers)
