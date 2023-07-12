/* 
MyPage bookmarklet
Copyright 2006 Steve Clay
License: http://mrclay.org/licenses/bsd.html
*/
(function() {
	var
		doc = document,
		i = 0,
		l,
		editMode = 0, // edit mode
		htmlEditor, // HTML editor
		body = doc.body,
		window = window,
		selected = [], // selected
		hid = [],
		$ = body.getElementsByTagName('*'),
		cTp = (doc.all && !window.opera)? 'absolute' : 'fixed', //ie
		css = doc.createElement('style');
	css.type = 'text/css';
	css.media = 'all';
	// help panel
	var cT = '#mPp{font-size:15px;padding:5px;background:#fdd;color:#000;position:'+cTp+';top:0;right:0;zIndex:1000;text-align:right}#mPp:hover{padding:.5em;line-height:1.6;}#mPp:hover u{display:none}#mPp i{display:none;text-align:left;cursor:default;color:#000}#mPp:hover i{display:block}#mPp b{border:1px outset #000;background:#fff;color:#666;padding:0 2px;margin-right:4px}#mPe{position:absolute;left:0;right:0;padding:5px 10px;background:#fdd;text-align:left}#mPe textarea{width:99%;display:block}' + 
	// rest must be important
'.mPs,.mPs *{background:#ff0;color:#000;}.mPh{background:#ffc; opacity:0.6;}.mPi,.mPi *{background:#fff;width:auto;float:none;margin:1em 0;padding:0;}body.mPi{text-align:left;margin:0;}'.replace(/;/g,' !important;');
	if (css.styleSheet)
		css.styleSheet.cssText = cT;
	else
		css.appendChild(doc.createTextNode(cT)); // webkit no like innerHTML
	doc.getElementsByTagName('head')[0].appendChild(css);
	
	function noEventBubbling(e) { // no event bubbling
		if (!e) var e = window.event; // IE
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
	}
	function over(e) {
		noEventBubbling(e);
		!editMode && !this.isSel && changeClassName(this, 'mPh');
	}
	function out(e) {
		noEventBubbling(e);
		!editMode && !this.isSel && changeClassName(this);
	}
	function clik(e) {
		noEventBubbling(e);
		!editMode && this.isSel? unSelect(this) : select(this);
		return false;
	}
	while (l = $.item(i++)) { // all elements
		addEvents(l);
	}
	var h = doc.createElement('a'); //help panel
	h.id = 'mPp';
	h.href = 'http://mrclay.org/';
	h.innerHTML = '<u>?</u><i><b>R</b>emove Selected</i><i><b>U</b>ndo Remove</i><i><b>I</b>solate Selected</i><i><b>P</b>rint Preview</i><i><b>W</b>iden Selected</i><i><i><b>B</b>ackwards</i><b>N</b>ext</i><i><b>D</b>eselect</i><i><b>C</b>opy Element</i><i><b>E</b>dit HTML</i><i><b>Esc</b>ape/Quit</i>';
	h.onclick = function(e) {noEventBubbling(e);};
	body.appendChild(h);
	doc.onkeydown = function(e) {
		var lastSelected = selected.length? selected[selected.length - 1] : 0; //last selection
		if (!e) var e = window.event;
		if (e.keyCode == 27) { // esc = exit, cleanup events
			remove(h);
			remove(css);
			i = 0;
			while (l = $.item(i++)) {
				l.onmouseover = l.oldOnmouseover || null;
				l.onmouseout = l.oldOnmouseout || null;
				l.onclick = l.oldOnclick || null;
				l.oldOnmouseover = null;
				l.oldOnmouseout = null;
				l.oldOnclick = null;
			}
			doc.onkeydown = null;
			editMode && remove(htmlEditor);
		}
		if (editMode) return true;
		switch (e.keyCode) {
			case 82: // r = remove
				while (selected.length) {
					lastSelected = selected[selected.length - 1];
					lastSelected.style.display = 'none';
					unSelect(lastSelected);
					hid.push(lastSelected);
				}
			break;
			case 73: // i = isolate
				select(h);
				while (body.hasChildNodes()) body.removeChild(body.firstChild);
				while (selected.length) {
					body.appendChild(selected[0]);
					unSelect(selected[0]);
				}
			break;
			case 87: // w = widen
				if (lastSelected) {
					unSelect(lastSelected);
					(lastSelected!=body) && select(lastSelected.parentNode);
				}
			break;
			case 80: // p = print preview
				pp();
			break;
			case 68: // d = deselect
				unSelect(lastSelected);
			break;
			case 85: // u = undo remove
				hid.length && (hid.pop().style.display = '');
			break;
			case 69: // e = edit HTML
				lastSelected && lastSelected.innerHTML && edit(lastSelected);
			break;
			case 66: // b = before element
				if (lastSelected) {
					l = doc.getElementsByTagName('*').item(getSourceIndex(lastSelected) - 1);
					if (l && l!=body) {
						unSelect(lastSelected);
						select(l);
					}
				}
			break;
			case 78: // n = next element
				if (lastSelected) {
					l = doc.getElementsByTagName('*').item(getSourceIndex(lastSelected) + 1);
					if (l && l!=h) {
						unSelect(lastSelected);
						select(l);
					}
				}
			break;
			case 67: // c = copy
				if (lastSelected) {
					l = lastSelected.cloneNode(true);
					if (lastSelected.id) {
						l.id += '_copy';
					}
					lastSelected.parentNode.insertBefore(l, lastSelected.nextSibling);
					addEvents(l);
					i = 0;
					var desc;
					while (desc = l.getElementsByTagName('*').item(i++))
						addEvents(desc);
					unSelect(lastSelected);
					select(l);
				}
			break;
			default: return true;
		}
		return false;
	};
	function remove(l) {
		l.parentNode.removeChild(l);
	}
	function changeClassName(l, cN) {
		l.className = l.className.replace(/\bmP[hs]\b/g, '');
		if (cN) l.className += l.className? ' ' + cN : cN;
	}
	function select(l) {
		changeClassName(l, 'mPs');
		l.isSel = '1';
		selected.push(l);
	}
	function unSelect(l) {
		changeClassName(l);
		l.isSel = '';
		for (var i=0, len=selected.length; i<len; i++) {
			if (selected[i]==l) {
				selected.splice(i, 1);
				return;
			}
		}
	}
	function edit(l) { // here we go
		editMode = 1;
		var 
			left = 0, // http://www.quirksmode.org/js/findpos.html :)
			top = 0,
			tmp = l,
			chg = 0; // has textarea changed
		if (tmp.offsetParent) {
			while (tmp.offsetParent) {
				left += tmp.offsetLeft;
				top += tmp.offsetTop;
				tmp = tmp.offsetParent;
			}
		}
		htmlEditor = doc.createElement('div'); //editor
		htmlEditor.id = 'mPe';
		body.appendChild(htmlEditor);
		htmlEditor.style.top = (top + l.offsetHeight + 5) + 'px';
		unSelect(l);
		var oh = getOuterHTML(l
			).replace(/^\s*|\s*$/g,'' 								// trim
			).replace(/ isSel[<>]*\u003E/g, '>'		// cust props (ie shows)
			).replace(/ class=""(?=[^<>]*>)/g, '');	// empty class
		select(l);
		var rows = Math.min(15, oh.split('\n').length + 3);
		htmlEditor.innerHTML = '<textarea id=mPta rows='+rows+'></textarea><button id=mPbu>done</button>';
		doc.getElementById('mPta').value = oh;
		doc.getElementById('mPta').onchange = function() {
			chg = 1;
		};
		function finEdit() {
			unSelect(l);
			editMode = 0;
			if (chg) {
				var tmp = body.appendChild(doc.createElement('div'));
				tmp.innerHTML = doc.getElementById('mPta').value;
				i = 0;
				var desc;
				while (desc = tmp.getElementsByTagName('*').item(i++))
					addEvents(desc);
				while (tmp.hasChildNodes()) 
					l.parentNode.insertBefore(tmp.firstChild, l);
				remove(l);
				remove(tmp);
			}
			remove(htmlEditor);			
		}
		doc.getElementById('mPbu').onclick = doc.getElementById('mPbu').onkeypress = finEdit; // wk needed kp
	}
	function addEvents(l) {
		if ('String' != typeof l.isSel) {
			l.isSel = '';
			// cache old events and use new
			l.oldOnmouseover = l.onmouseover;
			l.oldOnmouseout = l.onmouseout;
			l.oldOnclick = l.onclick;
			l.onmouseover = over;
			l.onmouseout = out;
			l.onclick = clik;
		}
	}
	function getSourceIndex(l) {
		if (l.sourceIndex) return l.sourceIndex;
		i = 0;
		var el;
		while (el = doc.getElementsByTagName('*').item(i)) {
			if (el==l) return i;	
			++i;
		}
	}
	function getOuterHTML(l) { // for gecko
		if (l.outerHTML) return l.outerHTML;
		var dv = doc.createElement('div');
		dv.appendChild(l.cloneNode(true));
		return dv.innerHTML;
	}
	function pp() { // from printPreview.js
		var 
			i = 0, 
			m,
			//d = document,
			ss = doc.styleSheets,
			wk = /webkit/i.test(navigator.userAgent);
		if (ss && !wk) { // use w3c
			for (i = 0; i<ss.length; i++) {
				m = ss[i].media;
				if (m.mediaText) // gecko
					m.mediaText = media(m.mediaText);
				else // ie
					ss[i].media = media(m);
			}
		} else { // limited to link and style elements
			ss = [];
			var r, l;
			while (l = doc.getElementsByTagName('link').item(i++)) { // collect stylesheet links...
				r = l.getAttribute('rel');
				if (r && /^style/i.test(r))
					ss.push(l);
			}
			i = 0;
			while (l = doc.getElementsByTagName('style').item(i++))
				ss.push(l); // ...and style elements
			for (i = ss.length - 1; i >= 0; i--) {
				if (wk)
					handleWk(ss[i]);
				else
					ss[i].media = media(ss[i].media);
			}
		}
		function media(m) {
			// opera wont store unknown media types, must use valid ones
			return (m=='all')? m
				: (/projection/.test(m))? 'print'
				: (/speech/.test(m))? 'screen'
				: (/print/.test(m))? 'screen,print,projection'
				: 'speech'; 
		}
		function handleWk(l) {
			if (/print/.test(l.media)) {
				var n = l.cloneNode(true);
				n.media = 'screen';
				l.parentNode.appendChild(n);
			} else if (/screen/.test(l.media)) {
				l.disabled = true;
			}
		}
	}
})();