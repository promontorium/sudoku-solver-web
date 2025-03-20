from collections import deque
from functools import wraps
from logging import getLogger
from typing import Callable, Iterable, Mapping, ParamSpec, Protocol, TypeVar

from events import Events  # type: ignore[import-untyped]

from .cell import Cell
from .exceptions import HistoryManagerException

_T = TypeVar("_T")
_P = ParamSpec("_P")


class HistoryManager:
    def __init__(self, cells: Iterable[Cell]):
        self._logger = getLogger(__name__)
        self._cells = frozenset(cells)
        self._events = Events()
        self._state: dict[Cell, tuple[int, frozenset[int]]] = {}
        self._undo_stack: deque[Mapping[Cell, tuple[int, frozenset[int]]]] = deque()
        self._redo_stack: deque[Mapping[Cell, tuple[int, frozenset[int]]]] = deque()
        self._action: dict[Cell, tuple[int, frozenset[int]]] = {}
        self._is_history_frozen = False
        self._is_complex_action = False

    def __str__(self) -> str:
        return "HistoryManager"

    @property
    def is_undo_possible(self) -> bool:
        return bool(self._undo_stack)

    @property
    def is_redo_possible(self) -> bool:
        return bool(self._redo_stack)

    @property
    def is_history_enabled(self) -> bool:
        return bool(self._state)

    @property
    def is_complex_action(self) -> bool:
        return self._is_complex_action

    @is_complex_action.setter
    def is_complex_action(self, value: bool) -> None:
        self._is_complex_action = value
        self._emit_action()

    def enable_history(self, *, undo_maxlen: int | None = None, redo_maxlen: int | None = None) -> None:
        if self.is_history_enabled:
            return
        self._undo_stack = deque(maxlen=undo_maxlen)
        self._redo_stack = deque(maxlen=redo_maxlen)
        self._action.clear()
        for cell in self._cells:
            cell.add_on_change_handler(self._handle_cell_on_change)
            self._state[cell] = cell.get_state()

    def disable_history(self) -> None:
        if not self.is_history_enabled:
            return
        self._undo_stack.clear()
        self._redo_stack.clear()
        self._action.clear()
        self._state.clear()
        for cell in self._cells:
            cell.remove_on_change_handler(self._handle_cell_on_change)

    def undo(self) -> None:
        self._logger.info("%s: Running undo", self)
        if not self.is_undo_possible:
            raise HistoryManagerException(f"{self}: Nothing to undo")
        state = self._undo_stack.pop()
        self._redo_stack.append({cell: self._state[cell] for cell in state})
        self._restore(state)
        self._logger.debug("%s: On change: undo", self)
        self._events.on_change()

    def redo(self) -> None:
        self._logger.info("%s: Running redo", self)
        if not self.is_redo_possible:
            raise HistoryManagerException(f"{self}: Nothing to redo")
        state = self._redo_stack.pop()
        self._undo_stack.append({cell: self._state[cell] for cell in state})
        self._restore(state)
        self._logger.debug("%s: On change: redo", self)
        self._events.on_change()

    def add_on_change_handler(self, handler: Callable[[], None]) -> None:
        self._events.on_change += handler

    def remove_on_change_handler(self, handler: Callable[[], None]) -> None:
        self._events.on_change -= handler

    def _restore(self, state: Mapping[Cell, tuple[int, frozenset[int]]]) -> None:
        self._is_history_frozen = True
        try:
            for cell, cell_state in state.items():
                cell.restore(cell_state)
                self._state[cell] = cell_state
        finally:
            self._is_history_frozen = False

    def _handle_cell_on_change(self, sender: Cell) -> None:
        self._logger.debug("%s: processing on change event sender=%s", self, sender)
        if sender not in self._state:
            raise HistoryManagerException(f"{self}: Subscription error {sender=}")
        if self._is_history_frozen:
            self._logger.debug("%s: skipping on change event sender=%s", self, sender)
            return
        state = sender.get_state()
        if self._state[sender] == state:
            self._action.pop(sender, None)  # cell state reverted - forget action
        else:
            self._action[sender] = state
        self._emit_action()

    def _emit_action(self) -> None:
        if self.is_complex_action or not self._action:
            return
        self._redo_stack.clear()
        self._undo_stack.append({cell: self._state[cell] for cell in self._action})
        for cell, state in self._action.items():
            self._state[cell] = state
        self._action.clear()
        self._logger.debug("%s: On change: history emitted", self)
        self._events.on_change()


class HistoryManagerHolder(Protocol):
    @property
    def history_manager(self) -> HistoryManager:
        pass


# TODO type hints
def as_complex_action(func: Callable[_P, _T]) -> Callable[_P, _T]:
    @wraps(func)
    def wrapper(self: HistoryManagerHolder, *args: _P.args, **kwargs: _P.kwargs) -> _T:
        prev_state = self.history_manager.is_complex_action
        self.history_manager.is_complex_action = True
        try:
            return func(self, *args, **kwargs)  # type: ignore[arg-type]
        finally:
            self.history_manager.is_complex_action = prev_state

    return wrapper  # type: ignore[return-value]
