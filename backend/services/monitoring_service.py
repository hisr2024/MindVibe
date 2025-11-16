class MonitoringService:
    def __init__(self):
        """Initialize the MonitoringService class."""
        self.performance_metrics = {}
        self.api_status = {}
        self.error_log = []
        self.health_status = "Healthy"

    def track_performance(self, metric_name, value):
        """Track a specific performance metric."""
        self.performance_metrics[metric_name] = value

    def monitor_api(self, api_name, status):
        """Monitor the status of an API."""
        self.api_status[api_name] = status

    def log_error(self, error_message):
        """Log an error message."""
        self.error_log.append(error_message)

    def check_health(self):
        """Check and return the health status of the service."""
        # Here you can add logic to check various health metrics
        return self.health_status

    def report(self):
        """Generate a report of the monitored data."""
        report_data = {
            "performance_metrics": self.performance_metrics,
            "api_status": self.api_status,
            "error_log": self.error_log,
            "health_status": self.health_status,
        }
        return report_data
