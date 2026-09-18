import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),               # prints to console
        logging.FileHandler("app.log")          # saves to file
    ]
)

logger = logging.getLogger("crud_app")