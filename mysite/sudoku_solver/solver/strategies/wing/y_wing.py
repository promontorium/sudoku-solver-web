from typing import Iterable

from ... import Cell
from .wing_strategy import WingStrategy


class YWing(WingStrategy):
    """Pivot/Hinge: cell that contains exactly two candidates
    Pincers/Wings: pivot candidates pairs (in two different containers)
    sharing one candidate (also contain exactly two candidates)
    If cell contains pincers shared candidate and can see both pincers - candidate can be removed from this cell
    """

    def __str__(self) -> str:
        return "Y-Wing/XY-Wing"

    def _get_pivot_cands_count(self) -> int:
        return 2

    def _get_base_cells(self, pivot: Cell, pincers: tuple[Cell, Cell]) -> Iterable[Cell]:
        return pincers
