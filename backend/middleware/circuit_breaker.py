"""
Circuit Breaker Pattern Implementation

Protects backend services from cascading failures by:
- Monitoring failure rates
- Opening circuit after threshold breached
- Auto-recovery with half-open state
- Preventing resource exhaustion
"""

import time
import logging
from enum import Enum
from typing import Callable, Optional
from collections import deque

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit tripped, rejecting requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker for protecting services from overload.
    
    States:
    - CLOSED: Normal operation, all requests pass through
    - OPEN: Too many failures, rejecting all requests
    - HALF_OPEN: Testing recovery, allowing limited requests
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        timeout: float = 60.0,
        monitoring_period: float = 60.0,
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Name of the circuit (for logging)
            failure_threshold: Number of failures before opening circuit
            success_threshold: Number of successes needed to close circuit from half-open
            timeout: Seconds to wait before attempting recovery (open -> half-open)
            monitoring_period: Period for tracking failure rate
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout = timeout
        self.monitoring_period = monitoring_period

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.last_state_change: float = time.time()

        # Track recent operations for failure rate calculation
        self.recent_operations: deque = deque(maxlen=100)

    def _record_operation(self, success: bool):
        """Record an operation result."""
        current_time = time.time()
        self.recent_operations.append((current_time, success))

        # Cleanup old operations
        cutoff_time = current_time - self.monitoring_period
        while self.recent_operations and self.recent_operations[0][0] < cutoff_time:
            self.recent_operations.popleft()

    def _calculate_failure_rate(self) -> float:
        """Calculate failure rate over monitoring period."""
        if not self.recent_operations:
            return 0.0

        failures = sum(1 for _, success in self.recent_operations if not success)
        return failures / len(self.recent_operations)

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset."""
        if self.state != CircuitState.OPEN:
            return False

        if self.last_failure_time is None:
            return True

        return (time.time() - self.last_failure_time) >= self.timeout

    def _transition_to_state(self, new_state: CircuitState):
        """Transition to a new state."""
        old_state = self.state
        self.state = new_state
        self.last_state_change = time.time()

        logger.info(
            f"[Circuit Breaker] {self.name}: {old_state.value} -> {new_state.value}"
        )

        if new_state == CircuitState.OPEN:
            logger.warning(
                f"[Circuit Breaker] {self.name} opened. "
                f"Failure rate: {self._calculate_failure_rate():.2%}"
            )
        elif new_state == CircuitState.CLOSED:
            logger.info(f"[Circuit Breaker] {self.name} closed. Service recovered.")

    def call(self, func: Callable, *args, **kwargs):
        """
        Execute function with circuit breaker protection.
        
        Args:
            func: Function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
            
        Returns:
            Function result
            
        Raises:
            Exception: If circuit is open or function fails
        """
        # Check if we should attempt reset
        if self._should_attempt_reset():
            self._transition_to_state(CircuitState.HALF_OPEN)
            self.failure_count = 0
            self.success_count = 0

        # Reject if circuit is open
        if self.state == CircuitState.OPEN:
            raise CircuitBreakerOpenError(
                f"Circuit breaker '{self.name}' is open. Service unavailable."
            )

        try:
            # Execute function
            result = func(*args, **kwargs)

            # Record success
            self._record_operation(success=True)

            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self._transition_to_state(CircuitState.CLOSED)
                    self.failure_count = 0
            elif self.state == CircuitState.CLOSED:
                # Reset failure count on success in closed state
                self.failure_count = 0

            return result

        except Exception as e:
            # Record failure
            self._record_operation(success=False)
            self.last_failure_time = time.time()
            self.failure_count += 1

            logger.warning(
                f"[Circuit Breaker] {self.name} failure #{self.failure_count}: {e}"
            )

            # Check if we should open the circuit
            if self.state == CircuitState.HALF_OPEN:
                self._transition_to_state(CircuitState.OPEN)
            elif self.state == CircuitState.CLOSED:
                if self.failure_count >= self.failure_threshold:
                    self._transition_to_state(CircuitState.OPEN)

            raise

    @property
    def is_open(self) -> bool:
        """Check if circuit is open."""
        return self.state == CircuitState.OPEN

    @property
    def is_closed(self) -> bool:
        """Check if circuit is closed."""
        return self.state == CircuitState.CLOSED

    def reset(self):
        """Manually reset the circuit breaker."""
        logger.info(f"[Circuit Breaker] {self.name} manually reset")
        self._transition_to_state(CircuitState.CLOSED)
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None

    def get_stats(self) -> dict:
        """Get circuit breaker statistics."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "failure_rate": self._calculate_failure_rate(),
            "last_state_change": self.last_state_change,
            "operations_tracked": len(self.recent_operations),
        }


class CircuitBreakerOpenError(Exception):
    """Exception raised when circuit breaker is open."""
    pass


# Global circuit breakers for different services
_circuit_breakers = {}


def get_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    success_threshold: int = 2,
    timeout: float = 60.0,
) -> CircuitBreaker:
    """
    Get or create a circuit breaker.
    
    Args:
        name: Circuit breaker name
        failure_threshold: Failures before opening
        success_threshold: Successes needed to close
        timeout: Seconds before attempting recovery
        
    Returns:
        CircuitBreaker instance
    """
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(
            name=name,
            failure_threshold=failure_threshold,
            success_threshold=success_threshold,
            timeout=timeout,
        )
    return _circuit_breakers[name]


def get_all_circuit_breakers() -> dict:
    """Get statistics for all circuit breakers."""
    return {name: cb.get_stats() for name, cb in _circuit_breakers.items()}
