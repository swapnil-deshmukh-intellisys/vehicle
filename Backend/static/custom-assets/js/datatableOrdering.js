function getColumnIndexByName(columnName, headerRow) {
    for (var i = 0; i < headerRow.length; i++) {
      if (headerRow.eq(i).text().trim().toLowerCase() === columnName.toLowerCase()) {
        return i;
      }
    }
    // Default to sorting by the first column if column not found
    return 0;
  }
  