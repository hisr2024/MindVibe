"""Unit tests for the migration module's SQL parsing functionality."""

from backend.core.migrations import _statements, _strip_comments


class TestStripComments:
    """Test cases for the _strip_comments function."""

    def test_strip_single_line_comment(self):
        """Test removing single-line comments with --."""
        sql = "SELECT * FROM users; -- This is a comment"
        result = _strip_comments(sql)
        assert result == "SELECT * FROM users;"

    def test_strip_multiple_line_comments(self):
        """Test removing multiple single-line comments."""
        sql = """-- Comment at the start
SELECT * FROM users;
-- Another comment
SELECT * FROM posts;"""
        result = _strip_comments(sql)
        assert "-- Comment" not in result
        assert "-- Another" not in result
        assert "SELECT * FROM users;" in result
        assert "SELECT * FROM posts;" in result

    def test_strip_block_comment_single_line(self):
        """Test removing block comments on a single line."""
        sql = "SELECT * /* inline comment */ FROM users;"
        result = _strip_comments(sql)
        assert result == "SELECT *  FROM users;"

    def test_strip_block_comment_multiline(self):
        """Test removing multi-line block comments."""
        sql = """/* This is a
multi-line
comment */
SELECT * FROM users;"""
        result = _strip_comments(sql)
        assert "/*" not in result
        assert "*/" not in result
        assert "multi-line" not in result
        assert "SELECT * FROM users;" in result

    def test_strip_mixed_comments(self):
        """Test removing both types of comments."""
        sql = """-- Line comment
SELECT * FROM users; /* block comment */
-- Another line comment
INSERT INTO posts (id) VALUES (1);"""
        result = _strip_comments(sql)
        assert "--" not in result
        assert "/*" not in result
        assert "SELECT * FROM users;" in result
        assert "INSERT INTO posts" in result

    def test_preserve_sql_without_comments(self):
        """Test that SQL without comments is preserved."""
        sql = "SELECT * FROM users;\nINSERT INTO posts (id) VALUES (1);"
        result = _strip_comments(sql)
        assert result == sql

    def test_strip_comment_before_create_table(self):
        """Test removing comments attached to CREATE TABLE statements."""
        sql = """-- Create user_journey_progress table for tracking user's journey through KIAAN modules
CREATE TABLE IF NOT EXISTS user_journey_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL
);"""
        result = _strip_comments(sql)
        assert "-- Create user_journey_progress" not in result
        assert "CREATE TABLE IF NOT EXISTS user_journey_progress" in result
        assert "id SERIAL PRIMARY KEY" in result


class TestStatements:
    """Test cases for the _statements function."""

    def test_simple_statement_parsing(self):
        """Test parsing simple SQL statements."""
        sql = "SELECT * FROM users; SELECT * FROM posts;"
        statements = list(_statements(sql))
        assert len(statements) == 2
        assert "SELECT * FROM users" in statements[0]
        assert "SELECT * FROM posts" in statements[1]

    def test_statements_with_comments_stripped(self):
        """Test that comments are stripped before parsing statements."""
        sql = """-- First comment
SELECT * FROM users;
-- Second comment
SELECT * FROM posts;"""
        statements = list(_statements(sql))
        assert len(statements) == 2
        # Verify no comments in the statements
        for stmt in statements:
            assert "--" not in stmt

    def test_create_table_with_comment(self):
        """Test parsing CREATE TABLE with a preceding comment."""
        sql = """-- Create user_journey_progress table
CREATE TABLE IF NOT EXISTS user_journey_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL
);"""
        statements = list(_statements(sql))
        assert len(statements) == 1
        assert "CREATE TABLE IF NOT EXISTS user_journey_progress" in statements[0]
        assert "--" not in statements[0]

    def test_multiple_create_tables_with_comments(self):
        """Test parsing multiple CREATE TABLE statements with comments."""
        sql = """-- First table
CREATE TABLE IF NOT EXISTS table1 (id SERIAL PRIMARY KEY);
-- Second table
CREATE TABLE IF NOT EXISTS table2 (id SERIAL PRIMARY KEY);"""
        statements = list(_statements(sql))
        assert len(statements) == 2
        for stmt in statements:
            assert "--" not in stmt
        assert "table1" in statements[0]
        assert "table2" in statements[1]

    def test_dollar_quoted_blocks(self):
        """Test that dollar-quoted blocks are handled correctly."""
        sql = """CREATE FUNCTION test() RETURNS TEXT AS $$
BEGIN
    RETURN 'test; statement';
END;
$$ LANGUAGE plpgsql;"""
        statements = list(_statements(sql))
        assert len(statements) == 1
        assert "CREATE FUNCTION test()" in statements[0]
        assert "RETURN 'test; statement'" in statements[0]

    def test_single_quoted_strings(self):
        """Test that semicolons in single-quoted strings are ignored."""
        sql = "INSERT INTO posts (content) VALUES ('Hello; World');"
        statements = list(_statements(sql))
        assert len(statements) == 1
        assert "Hello; World" in statements[0]

    def test_double_quoted_identifiers(self):
        """Test that semicolons in double-quoted identifiers are ignored."""
        sql = 'SELECT "column;name" FROM users;'
        statements = list(_statements(sql))
        assert len(statements) == 1
        assert "column;name" in statements[0]

    def test_block_comments_in_statements(self):
        """Test that block comments are stripped from statements."""
        sql = """SELECT * /* comment */ FROM users;
INSERT /* another */ INTO posts (id) VALUES (1);"""
        statements = list(_statements(sql))
        assert len(statements) == 2
        for stmt in statements:
            assert "/*" not in stmt
            assert "*/" not in stmt

    def test_empty_statements_filtered(self):
        """Test that empty statements are filtered out."""
        sql = ";;; SELECT * FROM users; ;;"
        statements = list(_statements(sql))
        # Should only have 1 statement, empty ones filtered
        assert len(statements) == 1
        assert "SELECT * FROM users" in statements[0]

    def test_kiaan_migration_file_format(self):
        """Test parsing a realistic migration file similar to the KIAAN migration."""
        sql = """-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_journey_progress CASCADE;

-- Create user_journey_progress table for tracking user's journey through KIAAN modules
CREATE TABLE IF NOT EXISTS user_journey_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    module_name VARCHAR(100) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user ON user_journey_progress(user_id);"""
        statements = list(_statements(sql))
        # Should have 3 statements: DROP, CREATE TABLE, CREATE INDEX
        assert len(statements) == 3
        # Verify no comments in the output
        for stmt in statements:
            assert "--" not in stmt
        # Verify statements are correct
        assert "DROP TABLE IF EXISTS user_journey_progress CASCADE" in statements[0]
        assert "CREATE TABLE IF NOT EXISTS user_journey_progress" in statements[1]
        assert "CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user" in statements[2]
