function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';

    // Handle line comment
    if (inLineComment) {
      current += char;
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    // Handle block comment
    if (inBlockComment) {
      current += char;
      if (char === '*' && nextChar === '/') {
        current += nextChar;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    // Handle dollar-quoted string ($$...$$ or $tag$...$tag$)
    if (dollarTag !== null) {
      current += char;
      if (char === '$') {
        const remaining = sql.slice(i);
        if (remaining.startsWith(dollarTag)) {
          current += dollarTag.slice(1);
          i += dollarTag.length - 1;
          dollarTag = null;
        }
      }
      continue;
    }

    // Handle single quote string ('...')
    if (inSingleQuote) {
      current += char;
      if (char === "'") {
        if (nextChar === "'") {
          current += nextChar;
          i++; // escaped quote
        } else {
          inSingleQuote = false;
        }
      }
      continue;
    }

    // Handle double quote identifier ("...")
    if (inDoubleQuote) {
      current += char;
      if (char === '"') {
        if (nextChar === '"') {
          current += nextChar;
          i++;
        } else {
          inDoubleQuote = false;
        }
      }
      continue;
    }

    // Start of line comment
    if (char === '-' && nextChar === '-') {
      current += char + nextChar;
      i++;
      inLineComment = true;
      continue;
    }

    // Start of block comment
    if (char === '/' && nextChar === '*') {
      current += char + nextChar;
      i++;
      inBlockComment = true;
      continue;
    }

    // Start of dollar quote
    if (char === '$') {
      const match = sql.slice(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
      if (match) {
        dollarTag = match[1];
        current += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }

    // Start of single quote
    if (char === "'") {
      current += char;
      inSingleQuote = true;
      continue;
    }

    // Start of double quote
    if (char === '"') {
      current += char;
      inDoubleQuote = true;
      continue;
    }

    // Semicolon separator
    if (char === ';') {
      current += ';';
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const finalTrimmed = current.trim();
  if (finalTrimmed) {
    statements.push(finalTrimmed);
  }

  return statements;
}

module.exports = { splitSqlStatements };
