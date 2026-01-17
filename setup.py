from setuptools import find_packages, setup

setup(
    name="mindvibe",
    version="2.0.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.100.0,<1.0.0",
        "pydantic>=2.0.0,<3.0.0",
        "sqlalchemy>=2.0.0,<3.0.0",
        "python-jose[cryptography]>=3.3.0,<4.0.0",
        "passlib[bcrypt]>=1.7.4,<2.0.0",
        "python-multipart>=0.0.5,<0.0.22",
        "uvicorn>=0.22.0,<0.41.0",
        "python-dotenv>=1.0.0,<2.0.0",
        "openai>=0.27.0,<3.0.0",
        "numpy>=1.24.0,<3.0.0",
        "asyncpg>=0.27.0,<0.32.0",
        "psycopg2-binary>=2.9.0,<3.0.0",
        "aiofiles>=23.0.0,<26.0.0",
    ],
    python_requires=">=3.11",
)
