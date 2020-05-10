let md = (src) => {
  // TODO:
  // -> Convert to es6 + reduce size
  //  * Sub-lists
  //  * Escapes
  //  * Fix inline markdown
  //  * Crash when writing footnote defs
  //  * Handle new lines and tags better
  let el = (t, c = false, v = false) => `<${t}${v ? ' ' + Object.entries(v).map(a => a[0] + '="' + a[1] + '"').join(' ') : ''}${c ? '>' + c + '</' + t + '>' : '/>'}`;
  let fns = [];
  const mdm = new Map([
    [/(^>+([^\n]+)?\n)+/gm, (m) => { // blockquotes
      return el('blockquote', m[0].trimEnd().split('\n').map((l, i, a) => {
        let j = l.replace(/^>+/, '');
        let n = l.length - j.length - 1;
        return '<blockquote>'.repeat(n) + j + '</blockquote>'.repeat(n) + (i < a.length - 1 ? '<br/>' : '');
      }).join(''));
    }],
    [/^(#{1,6})([^\n]+)/gm, (m) => { // headings
      if (m[2][0] === '#')
        return;
      let mm = /\{#([a-zA-Z0-9-_:.]+)\}\s?$/.exec(m[0]) || false;
      return el('h' + m[1].length, mm ? m[2].slice(0, m[2].length - mm[0].length) : m[2], mm ? {'id': mm[1]} : mm);
    }],
    [/(?:([\*_~]{1,3}))([^\*_~\n]+[^\*_~\s])\1/, m => m[1] === '~~' ? el('strike', m[2]) : el(['i', 'b', 'i><b'][m[1].length - 1], m[2])], // bold/italics/strikethough
    [/!?\[([^\]<>]+)\]\(([^\s\)<>]+)(\s"[^\(\)\"]+")?\)/, m => m[0][0] === '!' ? el('img', false, {'src': m[2], 'alt': m[1], 'title': m[1]}) : el('a', m[1], {'href': m[2]})], // tag links/images
    [/<(([a-z0-9_\-\.])+\@([a-z0-9_\-\.])+\.([a-z]{2,7}))>/gmi, m => el('a', m[1], {'href': 'mailto:' + m[1]})], // e-mails
    [/<([a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[\-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?)>/g, m => el('a', r.replace(/((https?|ftp):\/\/|mailto:)/gmi, ''), {'href': m[1]})], // links
    [/\`{3}([a-zA-Z-+#.]+\n)?([^`]+)\`{3}/, m => el('pre', el('code', m[2], {'class': m[1] === undefined ? 'nohighlight' : 'lang-' + m[1].trim()}))], // code block
    [/^([*\-=_] *){3,}$/gm, m => '\n<hr/>\n'], // horizontal rule
    [/(\n?(\*|-(\s?\[([\sxX])?\])?|\d\.)[^\n]+)+/gm, (m) => { // lists
      let l = m[0].trimStart().split('\n');
      let t = (x) => {
        switch (x) {
          case '*':
            return 'ul';
          case '-':
            return 'form';
          default:
            return isNaN(x) ? false : 'ol';
        }
      };
      if (!(t = t(l[0][0])))
        return;
      return (m[0][0] === '\n' ? '<br/>' : '') + el(t, l.map((x) => {
        let mm = /^-\s*(\[([xX]|\s*)?\])?/.exec(x) || false;
        return el(mm ? 'input' : 'li', x.replace(/^\s*\*|-(\s*\[([xX]|\s*)?\])?|\d\./, ''), mm ? (/[xX]|undefined/.exec(mm[1]) === null ? {'type': 'checkbox', 'disabled': ''} : {'type': 'checkbox', 'disabled': '', 'checked': ''}) : mm);
      }).join(''));
    }],
    [/(^[^\n]+)(\n:[^\n]+)+/gm, m => el('dl', m[0].split('\n').map(l => el(l.trim()[0] === ':' ? 'dd' : 'dt', l.replace(/^:/m, ''))).join(''))], // definition lists
    [/(([^|\n]+\s*\|\s*)+([^|\n]+\n))([\t\s]*(:?\-+:?\|)+(:?\-+:?)*\n)((([^|\n]+\s*\|\s*)+([^|\n]+)\n)+)/g, (m) => { // tables
      const ct = [false, {'align': 'left'}, {'align': 'right'}, {'align': 'center'}];
      let h = m[1].split('|');
      let ca = m[4].split('|').map(e => e.trim()).map((x, i) => {
        let n = 0;
        if (x[0] === ':')
          n++;
        if (x.slice(-1) === ':')
          n += 2;
        return n;
      });
      return el('table', el('thead', el('tr', ca.map((x, i) => el('th', h[i], ct[x])).join(''))) + el('tbody', m[7].split('\n').map(x => el('tr', x.split('|').map((y, i) => el('td', y.trim(), ct[ca[i]])).join(''))).join('')));
    }],
    [/\[\^([^\]]+)\](?!:)/g, (m) => { // footnote reference
      let n = fns.length + 1;
      fns[n - 1] = {
        'id': n,
        'tag': m[1],
        'content': undefined
      };
      return el('sup', el('a', n, {'href': '#fn:' + n}), {'id': 'fnref:' + m[1], 'role': 'doc-noteref'});
    }],
    [/\[\^([^\]]+)\](:([^\n]+))?/g, (m) => { // footnote definition
      let x = fns.find(o => o.tag === m[1]);
      if (x === undefined)
        return;
      x['content'] = m[3];
      return el('span', m[0], {'hidden': ''});
    }],
    [/(?=^|>|\n)\n+([^<]+?)\n+(?=\n|<|$)/g, m => el('p', m[1])] // paragraphs
  ]);
  for (let [k, v] of mdm) {
    let m, r;
    while ((m = k.exec(src)) !== null) {
      if ((r = v(m)) !== undefined)
        src = src.replace(m[0], r);
    }
  }
  if (fns.length)
    src += '<br/><br/><hr/>' + el('ol', fns.map(x => el('li', el('p', x['content'] + '&nbsp;' + el('a', '&#8617;', {'href': '#fnref:' + x['tag'], 'class': 'reversefootnote', 'role': 'doc-backlink'})), {'id': 'fn:' + x['tag'], 'role': 'doc-endnote'})).join(''));
  return src.replace(/\s{2,}[\n]{1,}/gmi, '<br/>');
};