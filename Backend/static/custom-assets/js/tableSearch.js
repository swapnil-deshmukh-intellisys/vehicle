function searchTable(searchInputId, tableId) {
  var input = document.getElementById(searchInputId);
  var filter = input.value.toLowerCase();
  var table = document.getElementById(tableId);
  var tbody = table.getElementsByTagName('tbody')[0];
  var tr = tbody.getElementsByTagName('tr');

  // Remove existing highlights from the entire table
  removeHighlights(tbody);

  for (var i = 0; i < tr.length; i++) {
    var tds = tr[i].getElementsByTagName('td');
    var match = false;

    for (var j = 0; j < tds.length; j++) {
      if (tds[j]) {
        var textValue = tds[j].textContent || tds[j].innerText;
        if (textValue.toLowerCase().indexOf(filter) > -1) {
          match = true;
          // Highlight matches if there is a filter
          if (filter) {
            highlightMatches(tds[j], filter);
          }
        }
      }
    }
    tr[i].style.display = match ? '' : 'none';
  }
}

function removeHighlights(element) {
  var highlights = element.querySelectorAll('.search-highlight');
  highlights.forEach(function (highlight) {
    var parent = highlight.parentNode;
    // Replace the span with its own text content
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize(); // Merge adjacent text nodes to keep the DOM clean
  });
}

function highlightMatches(element, filter) {
  // Walk the DOM to find all text nodes
  var textNodes = [];
  var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(function (node) {
    var text = node.nodeValue;
    var lowerText = text.toLowerCase();

    // Skip if no match in this specific text node
    if (lowerText.indexOf(filter) === -1) return;

    // Skip if this text node is already inside a highlight span (shouldn't happen due to removeHighlights, but safe check)
    if (node.parentNode.classList.contains('search-highlight')) return;

    var fragment = document.createDocumentFragment();
    var lastIdx = 0;
    var idx = lowerText.indexOf(filter);

    while (idx > -1) {
      // Append text before match
      if (idx > lastIdx) {
        fragment.appendChild(document.createTextNode(text.substring(lastIdx, idx)));
      }

      // Append match wrapped in span
      var span = document.createElement('span');
      span.className = 'search-highlight fw-bolder text-primary';
      span.textContent = text.substring(idx, idx + filter.length);
      fragment.appendChild(span);

      lastIdx = idx + filter.length;
      idx = lowerText.indexOf(filter, lastIdx);
    }

    // Append remaining text
    if (lastIdx < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
    }

    node.parentNode.replaceChild(fragment, node);
  });
}