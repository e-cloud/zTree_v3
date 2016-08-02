/*
 * JQuery zTree core v3.5.24
 * http://zTree.me/
 *
 * Copyright (c) 2010 Hunter.z
 *
 * Licensed same as jquery - MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * email: hunter.z@263.net
 * Date: 2016-06-06
 */
(function ($) {
	var settings = {};
	var roots = {};
	var caches = {};
	var _consts = {
		className: {
			BUTTON: "button",
			LEVEL: "level",
			ICO_LOADING: "ico_loading",
			SWITCH: "switch",
			NAME: 'node_name'
		},
		event: {
			NODECREATED: "ztree_nodeCreated",
			CLICK: "ztree_click",
			EXPAND: "ztree_expand",
			COLLAPSE: "ztree_collapse",
			ASYNC_SUCCESS: "ztree_async_success",
			ASYNC_ERROR: "ztree_async_error",
			REMOVE: "ztree_remove",
			SELECTED: "ztree_selected",
			UNSELECTED: "ztree_unselected"
		},
		id: {
			A: "_a",
			ICON: "_ico",
			// todo: SPAN shoud be TITLE
			SPAN: "_span",
			SWITCH: "_switch",
			UL: "_ul"
		},
		line: {
			ROOT: "root",
			ROOTS: "roots",
			CENTER: "center",
			BOTTOM: "bottom",
			NOLINE: "noline",
			LINE: "line"
		},
		folder: {
			OPEN: "open",
			CLOSE: "close",
			DOCU: "docu"
		},
		node: {
			CURSELECTED: "curSelectedNode"
		}
	};
	var defaultSetting = {
		treeId: "",
		treeObj: null,
		view: {
			addDiyDom: null,
			autoCancelSelected: true,
			dblClickExpand: true,
			expandSpeed: "fast",
			fontCss: {},
			nameIsHTML: false,
			selectedMulti: true,
			showIcon: true,
			showLine: true,
			showTitle: true,
			txtSelectedEnable: false
		},
		data: {
			key: {
				children: "children",
				name: "name",
				title: "",
				url: "url",
				icon: "icon"
			},
			simpleData: {
				enable: false,
				idKey: "id",
				pIdKey: "pId",
				rootPId: null
			},
			keep: {
				parent: false,
				leaf: false
			}
		},
		async: {
			enable: false,
			contentType: "application/x-www-form-urlencoded",
			type: "post",
			dataType: "text",
			url: "",
			autoParam: [],
			otherParam: [],
			dataFilter: null
		},
		callback: {
			beforeAsync: null,
			beforeClick: null,
			beforeDblClick: null,
			beforeRightClick: null,
			beforeMouseDown: null,
			beforeMouseUp: null,
			beforeExpand: null,
			beforeCollapse: null,
			beforeRemove: null,

			onAsyncError: null,
			onAsyncSuccess: null,
			onNodeCreated: null,
			onClick: null,
			onDblClick: null,
			onRightClick: null,
			onMouseDown: null,
			onMouseUp: null,
			onExpand: null,
			onCollapse: null,
			onRemove: null
		}
	};
	var /**
	 * default root of core, zTree use root to save full data
	 *
	 * root act as a virtual root node of the tree. it stores some global
	 * data of the tree, but it's not a tree node as it does not have
	 * properties of a tree node
	 *
	 * @param {ZTreeSetting} setting
	 * @private
	 */
	_initRoot = function (setting) {
		var root = data.getRoot(setting);

		// set a plain old empty object as root
		if (!root) {
			root = {};
			data.setRoot(setting, root);
		}

		// init some default properties of root
		root[setting.data.key.children] = []; // root node's children
		root.expandTriggerFlag = false; // flag indicating whether trigger
	                                    // expand event on root node
		root.curSelectedList = []; // the selected node list
		root.noSelection = true; // flag indicating whether enable selection
		root.createdNodes = []; // all the tree node created are cached here
		root.zId = 0; // for generating the unique tree node id within one
	                  // tree instance
		root._ver = (new Date()).getTime(); // version number
	};
	var /**
	 * default cache of core
	 * @param {ZTreeSetting} setting
	 * @private
	 */
	_initCache = function (setting) {
		var c = data.getCache(setting);
		if (!c) {
			c = {};
			data.setCache(setting, c);
		}
		c.nodes = [];
		c.doms = [];
	};
	var /**
	 * default bindEvent of core module, here listen to custom events for
	 * user
	 *
	 * Note: the callback's this is bound with $.fn.ztree
	 *
	 * Note2: events related to dom events are proxyed. Those events bubble
	 * to the tree element and dispatch by tree element
	 * @param {ZTreeSetting} setting
	 * @private
	 */
	_bindEvent = function (setting) {
		var treeElem = setting.treeObj;
		var customEvents = consts.event;

		treeElem.bind(customEvents.NODECREATED, function (event, treeId, node) {
			tools.apply(setting.callback.onNodeCreated, [event, treeId, node]);
		});

		treeElem.bind(customEvents.CLICK, function (event, srcEvent, treeId, node, clickFlag) {
			tools.apply(setting.callback.onClick, [srcEvent, treeId, node, clickFlag]);
		});

		treeElem.bind(customEvents.EXPAND, function (event, treeId, node) {
			tools.apply(setting.callback.onExpand, [event, treeId, node]);
		});

		treeElem.bind(customEvents.COLLAPSE, function (event, treeId, node) {
			tools.apply(setting.callback.onCollapse, [event, treeId, node]);
		});

		treeElem.bind(customEvents.ASYNC_SUCCESS, function (event, treeId, node, msg) {
			tools.apply(setting.callback.onAsyncSuccess, [event, treeId, node, msg]);
		});

		treeElem.bind(customEvents.ASYNC_ERROR, function (event, treeId, node, XMLHttpRequest, textStatus, errorThrown) {
			tools.apply(setting.callback.onAsyncError, [event, treeId, node, XMLHttpRequest, textStatus, errorThrown]);
		});

		treeElem.bind(customEvents.REMOVE, function (event, treeId, treeNode) {
			tools.apply(setting.callback.onRemove, [event, treeId, treeNode]);
		});

		treeElem.bind(customEvents.SELECTED, function (event, treeId, node) {
			tools.apply(setting.callback.onSelected, [treeId, node]);
		});

		treeElem.bind(customEvents.UNSELECTED, function (event, treeId, node) {
			tools.apply(setting.callback.onUnSelected, [treeId, node]);
		});
	};
	var /**
	 * default unbindEvent of core, to unbind custom events on tree element
	 * @param {ZTreeSetting} setting
	 * @privates
	 */
	_unbindEvent = function (setting) {
		var treeElement = setting.treeObj;
		var customEvents = consts.event;

		treeElement.unbind(customEvents.NODECREATED);
		treeElement.unbind(customEvents.CLICK);
		treeElement.unbind(customEvents.EXPAND);
		treeElement.unbind(customEvents.COLLAPSE);
		treeElement.unbind(customEvents.ASYNC_SUCCESS);
		treeElement.unbind(customEvents.ASYNC_ERROR);
		treeElement.unbind(customEvents.REMOVE);
		treeElement.unbind(customEvents.SELECTED);
		treeElement.unbind(customEvents.UNSELECTED);
	};
	var /**
	 * default event proxy of core
	 *
	 * this is a proxyResult builder.
	 *
	 * It extracts info from input event. Based on the info, it maps one
	 * type of events to the relevant callback, obtain the tree node
	 * object,
	 * Eventually constructs the proxy result for the real proxy handler to
	 * invoke the exact event handler.
	 *
	 * @param {Event} event
	 * @returns {ProxyResult}
	 * @private
	 */
	_eventProxy = function (event) {
		var target = event.target;
		var setting = data.getSetting(event.data.treeId);
		var tId = "";
		var node = null;

		/**
		 * NodeEvent refers to more general and conceptual event. basically
		 * they are triggered by one or more combined native DOM event
		 *
		 * i.e. 'switchNode' event, there is no DOM event called
		 * 'switchNode'. But obviously it's triggered along with click
		 * event if by UI interaction
		 *
		 * so, this kind of events is for conceptual categorization and for
		 * more clearly specific manipulation
		 *
		 * @name NodeEvent
		 */

		/**
		 * TreeEvent refers to origin event. They are identical with
		 * corresponding DOM event
		 * @name TreeEvent
		 */
		var nodeEventType = "";
		var treeEventType = "";
		var nodeEventCallback = null;
		var treeEventCallback = null;
		var matchedDom = null;

		// analyse the event type, retrieve the tId of the node containing
		// the target and conclude the mapping node event type
		switch (event.type.toLowerCase()) {
			case 'mousedown':
				treeEventType = "mousedown";
				break;
			case 'mouseup':
				treeEventType = "mouseup";
				break;
			case 'contextmenu':
				treeEventType = "contextmenu";
				break;
			case 'click':
				if (tools.eqs(target.tagName, "span") && target.getAttribute("treeNode" + consts.id.SWITCH) !== null) {
					tId = tools.getNodeMainDom(target).id;
					nodeEventType = "switchNode";
				} else {
					matchedDom = tools.getMatchDom(setting, target, [{
						tagName: "a",
						attrName: "treeNode" + consts.id.A
					}]);

					if (matchedDom) {
						tId = tools.getNodeMainDom(matchedDom).id;
						nodeEventType = "clickNode";
					}
				}
				break;
			case 'dbclick':
				treeEventType = "dblclick";
				matchedDom = tools.getMatchDom(setting, target, [{
					tagName: "a",
					attrName: "treeNode" + consts.id.A
				}]);

				if (matchedDom) {
					tId = tools.getNodeMainDom(matchedDom).id;
					nodeEventType = "switchNode";
				}
				break;
		}

		if (treeEventType.length > 0 && tId.length == 0) {
			matchedDom = tools.getMatchDom(setting, target, [{
				tagName: "a",
				attrName: "treeNode" + consts.id.A
			}]);

			if (matchedDom) {
				tId = tools.getNodeMainDom(matchedDom).id;
			}
		}

		// bind respective callback to node event
		if (tId.length > 0) {
			node = data.getNodeCache(setting, tId);
			switch (nodeEventType) {
				case "switchNode" :
					if (!node.isParent) {
						nodeEventType = "";
					} else if (tools.eqs(event.type, "click")
						|| (tools.eqs(event.type, "dblclick") && tools.apply(setting.view.dblClickExpand, [setting.treeId, node], setting.view.dblClickExpand))) {
						nodeEventCallback = handler.onSwitchNode;
					} else {
						nodeEventType = "";
					}
					break;
				case "clickNode" :
					nodeEventCallback = handler.onClickNode;
					break;
			}
		}

		// bind respective callback to ztree event
		switch (treeEventType) {
			case "mousedown" :
				treeEventCallback = handler.onZTreeMouseDown;
				break;
			case "mouseup" :
				treeEventCallback = handler.onZTreeMouseUp;
				break;
			case "dblclick" :
				treeEventCallback = handler.onZTreeDblClick;
				break;
			case "contextmenu" :
				treeEventCallback = handler.onZTreeContextMenu;
				break;
		}

		var proxyResult = {
			stop: false,
			node: node,
			nodeEventType: nodeEventType,
			nodeEventCallback: nodeEventCallback,
			treeEventType: treeEventType,
			treeEventCallback: treeEventCallback
		};
		return proxyResult
	};
	var /**
	 * default init node of core
	 * transform the data node to tree node
	 *
	 * @param {ZTreeSetting} setting
	 * @param {Number} level
	 * @param {TreeNode} node
	 * @param {TreeNode} parentNode
	 * @param {Boolean} isFirstNode
	 * @param {Boolean} isLastNode
	 * @param {Boolean} [openFlag] Deprecated/Unused
	 * @private
	 */
	_initNode = function (setting, level, node, parentNode, isFirstNode, isLastNode, openFlag) {
		if (!node) return;

		var root = data.getRoot(setting);
		var childKey = setting.data.key.children;

		node.level = level;
		// tId is a string made of treeId and incremental zId()
		node.tId = setting.treeId + "_" + (++root.zId);
		node.parentTId = parentNode ? parentNode.tId : null;
		node.open = (typeof node.open == "string") ?
			tools.eqs(node.open, "true") :
			!!node.open;

		if (node[childKey] && node[childKey].length > 0) {
			node.isParent = true;
			// tag for checking whether the parent node's child nodes will
			// be loaded asynchronously when the parent node is expanded.
			node.zAsync = true;
		} else {
			node.isParent = (typeof node.isParent == "string") ?
				tools.eqs(node.isParent, "true") :
				!!node.isParent;
			node.open = (node.isParent && !setting.async.enable) ? node.open : false;
			node.zAsync = !node.isParent;
		}
		node.isFirstNode = isFirstNode;
		node.isLastNode = isLastNode;
		node.getParentNode = function () {return data.getNodeCache(setting, node.parentTId);};
		node.getPreNode = function () {return data.getPreNode(setting, node);};
		node.getNextNode = function () {return data.getNextNode(setting, node);};
		node.getIndex = function () {return data.getNodeIndex(setting, node);};
		node.getPath = function () {return data.getNodePath(setting, node);};
		node.isAjaxing = false;
		data.fixPIdKeyValue(setting, node);
	};
	var /**
	 * this is something like the registry center for extending the
	 * initialization step
	 * @private
	 */
	_init = {
		bind: [_bindEvent],
		unbind: [_unbindEvent],
		caches: [_initCache],
		nodes: [_initNode],
		proxys: [_eventProxy],
		roots: [_initRoot],
		beforeA: [],
		afterA: [],
		innerBeforeA: [],
		innerAfterA: [],
		zTreeTools: []
	};
	var data = {
		/**
		 * add node to the cache
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 */
		addNodeCache: function (setting, node) {
			data.getCache(setting).nodes[data.getNodeCacheId(node.tId)] = node;
		},

		/**
		 * get the cache id of the node
		 * @param {String} tId
		 * @returns {string}
		 */
		getNodeCacheId: function (tId) {
			return tId.substring(tId.lastIndexOf("_") + 1);
		},

		/**
		 * add callback before appending node
		 * @param {Function} beforeA
		 */
		addBeforeAppend: function (beforeA) {
			_init.beforeA.push(beforeA);
		},

		/**
		 * add callback after appending node
		 * @param {Function} afterA
		 */
		addAfterAppend: function (afterA) {
			_init.afterA.push(afterA);
		},

		/**
		 * add callback before appending node inner content
		 * @param {Function} innerBeforeA
		 */
		addInnerBeforeAppend: function (innerBeforeA) {
			_init.innerBeforeA.push(innerBeforeA);
		},

		/**
		 * add callback after appending node inner content
		 * @param {Function} innerAfterA
		 */
		addInnerAfterAppend: function (innerAfterA) {
			_init.innerAfterA.push(innerAfterA);
		},

		/**
		 * register callback to bind events on init
		 * @param {Function<ZTreeSetting>} bindHandler
		 */
		addInitBind: function (bindHandler) {
			_init.bind.push(bindHandler);
		},

		/**
		 * add callback to unbind events on tree initialization
		 * @param {Function<ZTreeSetting>} unbindHandler
		 */
		addInitUnBind: function (unbindHandler) {
			_init.unbind.push(unbindHandler);
		},

		/**
		 * add handler to create cache on tree initialization
		 * @param { Function<ZTreeSetting> } handler
		 */
		addInitCache: function (handler) {
			_init.caches.push(handler);
		},

		/**
		 * add handler to init node on tree initialization
		 * @see _initNode
		 * @param {Function} handler
		 */
		addInitNode: function (handler) {
			_init.nodes.push(handler);
		},

		/**
		 * add handler to construct proxy result
		 * @param {Function<Event>} handler
		 * @param {Boolean} isFirst
		 */
		addInitProxy: function (handler, isFirst) {
			// todo: why should set first?
			if (!!isFirst) {
				_init.proxys.unshift(handler);
			} else {
				_init.proxys.push(handler);
			}
		},

		/**
		 * add handler when init root
		 * @param {Function<ZTreeSetting>} handler
		 */
		addInitRoot: function (handler) {
			_init.roots.push(handler);
		},

		/**
		 * add target nodes as children to the target parent node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} parentNode
		 * @param {Number} index
		 * @param {Array<TreeNode>} nodes
		 */
		addNodesData: function (setting, parentNode, index, nodes) {
			var childKey = setting.data.key.children;

			// init children array if not exist
			if (!parentNode[childKey]) {
				parentNode[childKey] = [];

				// append nodes to children array later
				index = -1;
			}
			// if index exceed the children array's length
			else if (index >= parentNode[childKey].length) {
				// append nodes to children array later
				index = -1;
			}

			// set up the line icon of the first child node
			if (parentNode[childKey].length > 0 && index === 0) {
				parentNode[childKey][0].isFirstNode = false;
				view.setNodeLineIcons(setting, parentNode[childKey][0]);
			}
			// set up the line icon of the last child node
			else if (parentNode[childKey].length > 0 && index < 0) {
				parentNode[childKey][parentNode[childKey].length - 1].isLastNode = false;
				view.setNodeLineIcons(setting, parentNode[childKey][parentNode[childKey].length - 1]);
			}

			parentNode.isParent = true;

			// append
			if (index < 0) {
				parentNode[childKey] = parentNode[childKey].concat(nodes);
			}
			// insert
			else {
				var params = [index, 0].concat(nodes);
				parentNode[childKey].splice.apply(parentNode[childKey], params);
			}
		},

		/**
		 * add the target node to the cursor selected list
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 */
		addSelectedNode: function (setting, node) {
			var root = data.getRoot(setting);

			if (!data.isSelectedNode(setting, node)) {
				root.curSelectedList.push(node);
			}
		},

		/**
		 * cache the created node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 */
		addCreatedNode: function (setting, node) {
			// if have any callback then push
			if (!!setting.callback.onNodeCreated || !!setting.view.addDiyDom) {
				var root = data.getRoot(setting);
				root.createdNodes.push(node);
			}
		},

		/**
		 * add handler to extend ZTreeTool(the object bound on root and
		 * return as treeObj of init method)
		 * @param zTreeTools
		 */
		addZTreeTools: function (zTreeTools) {
			_init.zTreeTools.push(zTreeTools);
		},

		/**
		 * extend the default setting with the source
		 * @param {Object} source
		 */
		extendSetting: function (source) {
			$.extend(true, defaultSetting, source);
		},

		/**
		 * set up the pId property
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 */
		fixPIdKeyValue: function (setting, node) {
			if (setting.data.simpleData.enable) {
				node[setting.data.simpleData.pIdKey] = node.parentTId ?
					node.getParentNode()[setting.data.simpleData.idKey] :
					setting.data.simpleData.rootPId;
			}
		},

		/**
		 * invoke the callbacks before appending `a` element inside node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @param {Array<String>} html -- the html to be appended
		 */
		getBeforeA: function (setting, node, html) {
			for (var i = 0, j = _init.beforeA.length; i < j; i++) {
				_init.beforeA[i].apply(this, arguments);
			}
		},

		/**
		 * invoke the callbacks after appending `a` element inside node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @param {Array<String>} html -- the html to be appended
		 */
		getAfterA: function (setting, node, html) {
			for (var i = 0, j = _init.afterA.length; i < j; i++) {
				_init.afterA[i].apply(this, arguments);
			}
		},

		/**
		 * invoke the callbacks before appending inner content of `a`
		 * element inside node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @param {Array<String>} html -- the appended html
		 */
		getInnerBeforeA: function (setting, node, html) {
			for (var i = 0, j = _init.innerBeforeA.length; i < j; i++) {
				_init.innerBeforeA[i].apply(this, arguments);
			}
		},

		/**
		 * invoke the callbacks after appending inner content of `a`
		 * element inside node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @param {Array<String>} html -- the appended html
		 */
		getInnerAfterA: function (setting, node, html) {
			for (var i = 0, j = _init.innerAfterA.length; i < j; i++) {
				_init.innerAfterA[i].apply(this, arguments);
			}
		},

		/**
		 * get the cache object according to the setting's tree id
		 * @param {ZTreeSetting} setting
		 * @returns {Object}
		 */
		getCache: function (setting) {
			return caches[setting.treeId];
		},

		/**
		 * Get the node's index in the same level nodes. (start from 0)
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {*}
		 */
		getNodeIndex: function (setting, node) {
			if (!node) return null;

			var childKey = setting.data.key.children;
			var parentNode = node.parentTId ? node.getParentNode() : data.getRoot(setting);

			for (var i = 0, l = parentNode[childKey].length - 1; i <= l; i++) {
				if (parentNode[childKey][i] === node) {
					return i;
				}
			}
			return -1;
		},

		/**
		 * get the previous sibling node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {TreeNode|null}
		 */
		getPreNode: function (setting, node) {
			if (!node) return null;

			var childKey = setting.data.key.children;
			var parentNode = node.parentTId ? node.getParentNode() : data.getRoot(setting);

			for (var i = 0, l = parentNode[childKey].length; i < l; i++) {
				if (parentNode[childKey][i] === node) {
					return (i == 0 ? null : parentNode[childKey][i - 1]);
				}
			}
			return null;
		},

		/**
		 * get the next sibling node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {null}
		 */
		getNextNode: function (setting, node) {
			if (!node) return null;

			var childKey = setting.data.key.children;
			var parentNode = node.parentTId ? node.getParentNode() : data.getRoot(setting);

			for (var i = 0, l = parentNode[childKey].length - 1; i <= l; i++) {
				if (parentNode[childKey][i] === node) {
					return (i == l ? null : parentNode[childKey][i + 1]);
				}
			}

			return null;
		},

		/**
		 * According to the node data attribute, search the node which
		 * exactly matches, and return the node object
		 *
		 * @param {ZTreeSetting} setting
		 * @param {Array<TreeNode>} nodes
		 * @param {String} key
		 * @param {String} value
		 * @returns {TreeNode|Null}
		 */
		getNodeByParam: function (setting, nodes, key, value) {
			if (!nodes || !key) return null;

			var childKey = setting.data.key.children;

			for (var i = 0, length = nodes.length; i < length; i++) {
				var node = nodes[i];

				if (node[key] == value && node.hasOwnProperty(key)) {
					return node;
				}

				var tmp = data.getNodeByParam(setting, node[childKey], key, value);
				if (tmp) return tmp;
			}
			return null;
		},

		/**
		 * retrieve the possibly cached node with the tId
		 * @param {ZTreeSetting} setting
		 * @param {String} tId
		 * @returns {null}
		 */
		getNodeCache: function (setting, tId) {
			if (!tId) return null;

			var node = caches[setting.treeId].nodes[data.getNodeCacheId(tId)];
			return node ? node : null;
		},

		/**
		 * get the name of the node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {string}
		 */
		getNodeName: function (setting, node) {
			var nameKey = setting.data.key.name;
			return node[nameKey].toString();
		},

		/**
		 * retrieve the path to the root node of target node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {Array<TreeNode>}
		 */
		getNodePath: function (setting, node) {
			if (!node) return null;

			var path;

			if (node.parentTId) {
				path = node.getParentNode().getPath();
			} else {
				path = [];
			}

			if (path) {
				path.push(node);
			}

			return path;
		},

		/**
		 * get the title of the node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {string}
		 */
		getNodeTitle: function (setting, node) {
			var titleKey = setting.data.key.title === "" ?
				setting.data.key.name :
				setting.data.key.title;
			return node[titleKey].toString();
		},

		/**
		 * get first-level nodes of target tree
		 * @param {ZTreeSetting} setting
		 * @returns {Array<TreeNode>}
		 */
		getNodes: function (setting) {
			return data.getRoot(setting)[setting.data.key.children];
		},

		/**
		 * According to the node data attribute, search the nodes
		 * recursively which exactly matches, and return the collection of
		 * node objects.
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} nodes
		 * @param {String} key
		 * @param {String} value
		 * @returns {Array<TreeNode>}
		 */
		getNodesByParam: function (setting, nodes, key, value) {
			if (!nodes || !key) return [];

			var childKey = setting.data.key.children;
			var result = [];

			for (var i = 0, length = nodes.length; i < length; i++) {
				if (nodes[i][key] == value) {
					result.push(nodes[i]);
				}

				result = result.concat(data.getNodesByParam(setting, nodes[i][childKey], key, value));
			}

			return result;
		},

		/**
		 * According to the node data attribute, search the nodes
		 * recursively which fuzzy match, and return the collection of
		 * node objects.
		 *
		 * Please use zTree object to executing the method.
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} nodes
		 * @param {String} key
		 * @param {String} value
		 * @returns {Array<TreeNode>}
		 */
		getNodesByParamFuzzy: function (setting, nodes, key, value) {
			if (!nodes || !key) return [];

			var childKey = setting.data.key.children;
			var result = [];

			value = value.toLowerCase();

			for (var i = 0, l = nodes.length; i < l; i++) {
				if (typeof nodes[i][key] == "string" && nodes[i][key].toLowerCase().indexOf(value) > -1) {
					result.push(nodes[i]);
				}

				result = result.concat(data.getNodesByParamFuzzy(setting, nodes[i][childKey], key, value));
			}
			return result;
		},

		/**
		 * filter the nodes recursively with the filter predicateFunc
		 *
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} nodes
		 * @param {function} filter
		 * @param {Boolean} isSingle
		 * @param {Object} invokeParam
		 * @returns {Array<TreeNode>}
		 */
		getNodesByFilter: function (setting, nodes, filter, isSingle, invokeParam) {
			if (!nodes) return (isSingle ? null : []);

			var childKey = setting.data.key.children;
			var result = isSingle ? null : [];

			for (var i = 0, l = nodes.length; i < l; i++) {
				if (tools.apply(filter, [nodes[i], invokeParam], false)) {
					if (isSingle) {
						return nodes[i];
					}
					result.push(nodes[i]);
				}

				var tmpResult = data.getNodesByFilter(setting, nodes[i][childKey], filter, isSingle, invokeParam);

				if (isSingle && !!tmpResult) {
					return tmpResult;
				}

				result = isSingle ? tmpResult : result.concat(tmpResult);
			}
			return result;
		},

		/**
		 * get the root if possible
		 * @param {ZTreeSetting} setting
		 * @returns {null}
		 */
		getRoot: function (setting) {
			return setting ? roots[setting.treeId] : null;
		},

		/**
		 * get all root nodes
		 * @returns {Object}
		 */
		getRoots: function () {
			return roots;
		},

		/**
		 * get the tree setting with target tree id
		 * @param {String} treeId
		 * @returns {ZTreeSetting}
		 */
		getSetting: function (treeId) {
			return settings[treeId];
		},

		/**
		 * get all tree settings
		 * @returns {{}}
		 */
		getSettings: function () {
			return settings;
		},

		/**
		 * get the ztree tool with target tree id
		 * @param {String} treeId
		 * @returns {ZTreeTool|null}
		 */
		getZTreeTools: function (treeId) {
			var root = this.getRoot(this.getSetting(treeId));
			return root ? root.treeTools : null;
		},

		/**
		 * invoke the handlers to init cache
		 * @param {ZTreeSetting} setting
		 */
		initCache: function (setting) {
			for (var i = 0, j = _init.caches.length; i < j; i++) {
				_init.caches[i].apply(this, arguments);
			}
		},

		/**
		 * invoke the handlers to init a tree node
		 * @param {ZTreeSetting} setting
		 * @param {Number}level
		 * @param {TreeNode} node
		 * @param {TreeNode} parentNode
		 * @param {TreeNode} preNode
		 * @param {TreeNode} nextNode
		 */
		initNode: function (setting, level, node, parentNode, preNode, nextNode) {
			for (var i = 0, j = _init.nodes.length; i < j; i++) {
				_init.nodes[i].apply(this, arguments);
			}
		},

		/**
		 * invoke the handlers to init root node
		 * @param {ZTreeSetting} setting
		 */
		initRoot: function (setting) {
			for (var i = 0, j = _init.roots.length; i < j; i++) {
				_init.roots[i].apply(this, arguments);
			}
		},

		/**
		 * check if the node is selected
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {boolean}
		 */
		isSelectedNode: function (setting, node) {
			var root = data.getRoot(setting);

			for (var i = 0, j = root.curSelectedList.length; i < j; i++) {
				if (node === root.curSelectedList[i]) return true;
			}

			return false;
		},

		/**
		 * remove the node from cache, and recursively remove its child
		 * nodes
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 */
		removeNodeCache: function (setting, node) {
			var childKey = setting.data.key.children;

			if (node[childKey]) {
				for (var i = 0, l = node[childKey].length; i < l; i++) {
					data.removeNodeCache(setting, node[childKey][i]);
				}
			}

			data.getCache(setting).nodes[data.getNodeCacheId(node.tId)] = null;
		},

		/**
		 * remove the selected node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} [node]
		 */
		removeSelectedNode: function (setting, node) {
			var root = data.getRoot(setting);

			for (var i = 0, j = root.curSelectedList.length; i < j; i++) {
				if (node === root.curSelectedList[i] || !data.getNodeCache(setting, root.curSelectedList[i].tId)) {
					root.curSelectedList.splice(i, 1);
					setting.treeObj.trigger(consts.event.UNSELECTED, [setting.treeId, node]);
					i--;
					j--;
				}
			}
		},

		/**
		 * set up cache object
		 * @param {ZTreeSetting} setting
		 * @param {Object} cache
		 */
		setCache: function (setting, cache) {
			caches[setting.treeId] = cache;
		},

		/**
		 * cache the target root node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} root
		 */
		setRoot: function (setting, root) {
			roots[setting.treeId] = root;
		},

		/**
		 * invoke the handlers to extend ZTreeTools
		 *
		 * the arguments are for the handlers to register util function on
		 * the zTreeTools
		 * @param {ZTreeSetting} setting
		 * @param {Object} zTreeTools
		 */
		setZTreeTools: function (setting, zTreeTools) {
			for (var i = 0, j = _init.zTreeTools.length; i < j; i++) {
				_init.zTreeTools[i].apply(this, arguments);
			}
		},

		/**
		 * transform the node tree to one dimension array
		 * @param {ZTreeSetting} setting
		 * @param {Array<TreeNode>|TreeNode} nodes
		 * @returns {Array}
		 */
		transformToArrayFormat: function (setting, nodes) {
			if (!nodes) return [];

			var childKey = setting.data.key.children;
			var result = [];

			if (tools.isArray(nodes)) {
				for (var i = 0, l = nodes.length; i < l; i++) {
					result.push(nodes[i]);
					if (nodes[i][childKey]) {
						result = result.concat(data.transformToArrayFormat(setting, nodes[i][childKey]));
					}
				}
			} else {
				result.push(nodes);
				if (nodes[childKey]) {
					result = result.concat(data.transformToArrayFormat(setting, nodes[childKey]));
				}
			}

			return result;
		},

		/**
		 * transform the array nodes to tree structure
		 * @param {ZTreeSetting} setting
		 * @param {Array<TreeNode>}sNodes
		 * @returns {Array<TreeNode>}
		 */
		transformTozTreeFormat: function (setting, sNodes) {
			var index;
			var length;
			var idKey = setting.data.simpleData.idKey;
			var parentKey = setting.data.simpleData.pIdKey;
			var childKey = setting.data.key.children;

			if (!idKey || idKey == "" || !sNodes) return [];

			if (tools.isArray(sNodes)) {
				var result = [];
				var tmpMap = {};

				for (index = 0, length = sNodes.length; index < length; index++) {
					tmpMap[sNodes[index][idKey]] = sNodes[index];
				}

				for (index = 0, length = sNodes.length; index < length; index++) {
					if (tmpMap[sNodes[index][parentKey]] && sNodes[index][idKey] != sNodes[index][parentKey]) {
						if (!tmpMap[sNodes[index][parentKey]][childKey]) {
							tmpMap[sNodes[index][parentKey]][childKey] = [];
						}

						tmpMap[sNodes[index][parentKey]][childKey].push(sNodes[index]);
					} else {
						result.push(sNodes[index]);
					}
				}

				return result;
			} else {
				return [sNodes];
			}
		}
	};
	var event = {
		/**
		 * invoke the handlers to bind events
		 * @param setting
		 */
		bindEvent: function (setting) {
			for (var i = 0, j = _init.bind.length; i < j; i++) {
				_init.bind[i].apply(this, arguments);
			}
		},

		/**
		 * invoke the handlers to unbind events
		 * @param setting
		 */
		unbindEvent: function (setting) {
			for (var i = 0, j = _init.unbind.length; i < j; i++) {
				_init.unbind[i].apply(this, arguments);
			}
		},

		/**
		 * bind dom events with proxy handler to the tree element
		 * @param setting
		 */
		bindTree: function (setting) {
			var eventParam = {
				treeId: setting.treeId
			};
			var treeElement = setting.treeObj;

			if (!setting.view.txtSelectedEnable) {
				// for can't select text
				treeElement.bind('selectstart', handler.onSelectStart).css({
					"-moz-user-select": "-moz-none"
				});
			}

			treeElement.bind('click', eventParam, event.proxy);
			treeElement.bind('dblclick', eventParam, event.proxy);
			treeElement.bind('mouseover', eventParam, event.proxy);
			treeElement.bind('mouseout', eventParam, event.proxy);
			treeElement.bind('mousedown', eventParam, event.proxy);
			treeElement.bind('mouseup', eventParam, event.proxy);
			treeElement.bind('contextmenu', eventParam, event.proxy);
		},

		/**
		 * unbind all the registered dom events of target tree
		 * @param setting
		 */
		unbindTree: function (setting) {
			var treeElement = setting.treeObj;

			treeElement.unbind('selectstart', handler.onSelectStart);
			treeElement.unbind('click', event.proxy);
			treeElement.unbind('dblclick', event.proxy);
			treeElement.unbind('mouseover', event.proxy);
			treeElement.unbind('mouseout', event.proxy);
			treeElement.unbind('mousedown', event.proxy);
			treeElement.unbind('mouseup', event.proxy);
			treeElement.unbind('contextmenu', event.proxy);
		},

		/**
		 * invoke the proxy builders
		 * @param e
		 * @returns {Array}
		 */
		doProxy: function (e) {
			var results = [];
			for (var i = 0, j = _init.proxys.length; i < j; i++) {
				var proxyResult = _init.proxys[i].apply(this, arguments);
				results.push(proxyResult);
				if (proxyResult.stop) {
					break;
				}
			}
			return results;
		},

		/**
		 * the handler to call the proxy builders,
		 * and invoke the real listeners ought to be called
		 * @param e
		 * @returns {boolean}
		 */
		proxy: function (e) {
			var setting = data.getSetting(e.data.treeId);

			if (!tools.uCanDo(setting, e)) return true;

			var results = event.doProxy(e);
			var result = true;
			var executed = false;

			for (var i = 0, l = results.length; i < l; i++) {
				var proxyResult = results[i];

				if (proxyResult.nodeEventCallback) {
					executed = true;
					result = proxyResult.nodeEventCallback.apply(proxyResult, [e, proxyResult.node]) && result;
				}

				if (proxyResult.treeEventCallback) {
					executed = true;
					result = proxyResult.treeEventCallback.apply(proxyResult, [e, proxyResult.node]) && result;
				}
			}

			return result;
		}
	};
	var handler = {
		/**
		 * handler for switch node
		 * @param event
		 * @param node
		 * @returns {boolean}
		 */
		onSwitchNode: function (event, node) {
			var setting = data.getSetting(event.data.treeId);

			if (node.open) {
				if (tools.apply(setting.callback.beforeCollapse, [setting.treeId, node], true) == false) return true;

				// turn on the flag so that the proxy handler knows what
				// should do
				data.getRoot(setting).expandTriggerFlag = true;
				view.switchNode(setting, node);
			} else {
				if (tools.apply(setting.callback.beforeExpand, [setting.treeId, node], true) == false) return true;
				data.getRoot(setting).expandTriggerFlag = true;
				view.switchNode(setting, node);
			}

			return true;
		},

		/**
		 * handler for click
		 * @param event
		 * @param node
		 * @returns {boolean}
		 */
		onClickNode: function (event, node) {
			var setting = data.getSetting(event.data.treeId);

			/**
			 * 0: using ctrl key or meta key and click on the selected
			 * node, then cancel select state
			 * 1: select node with multi mode
			 * 2: select node with single mode
			 * @type {number}
			 */
			var clickFlag = (
				setting.view.autoCancelSelected
				&& (event.ctrlKey || event.metaKey)
				&& data.isSelectedNode(setting, node)
			)
				? 0 :
				(setting.view.autoCancelSelected
					&& (event.ctrlKey || event.metaKey)
					&& setting.view.selectedMulti
				)
					? 2 : 1;

			if (tools.apply(setting.callback.beforeClick, [setting.treeId, node, clickFlag], true) == false) {
				return true;
			}

			if (clickFlag === 0) {
				view.cancelPreSelectedNode(setting, node);
			} else {
				view.selectNode(setting, node, clickFlag === 2);
			}

			setting.treeObj.trigger(consts.event.CLICK, [event, setting.treeId, node, clickFlag]);
			return true;
		},

		/**
		 * handler for mouse down on ztree
		 * @param event
		 * @param node
		 * @returns {boolean}
		 */
		onZTreeMouseDown: function (event, node) {
			var setting = data.getSetting(event.data.treeId);

			if (tools.apply(setting.callback.beforeMouseDown, [setting.treeId, node], true)) {
				tools.apply(setting.callback.onMouseDown, [event, setting.treeId, node]);
			}

			return true;
		},

		/**
		 * handler for mouse up on ztree
		 * @param event
		 * @param node
		 * @returns {boolean}
		 */
		onZTreeMouseUp: function (event, node) {
			var setting = data.getSetting(event.data.treeId);

			if (tools.apply(setting.callback.beforeMouseUp, [setting.treeId, node], true)) {
				tools.apply(setting.callback.onMouseUp, [event, setting.treeId, node]);
			}

			return true;
		},

		/**
		 * handler for double click on ztree
		 * @param event
		 * @param node
		 * @returns {boolean}
		 */
		onZTreeDblClick: function (event, node) {
			var setting = data.getSetting(event.data.treeId);

			if (tools.apply(setting.callback.beforeDblClick, [setting.treeId, node], true)) {
				tools.apply(setting.callback.onDblClick, [event, setting.treeId, node]);
			}

			return true;
		},

		/**
		 * handler for context menu (typically right click event)
		 * @param event
		 * @param node
		 * @returns {boolean}
		 */
		onZTreeContextMenu: function (event, node) {
			var setting = data.getSetting(event.data.treeId);

			if (tools.apply(setting.callback.beforeRightClick, [setting.treeId, node], true)) {
				tools.apply(setting.callback.onRightClick, [event, setting.treeId, node]);
			}

			return (typeof setting.callback.onRightClick) != "function";
		},

		/**
		 * handler for select start
		 * @param event
		 * @returns {boolean}
		 */
		onSelectStart: function (event) {
			var nodeName = event.originalEvent.srcElement.nodeName.toLowerCase();
			return (nodeName === "input" || nodeName === "textarea" );
		}
	};
	var tools = {
		/**
		 * apply the target function with `$.fn.zTree` as context
		 * @param {Function|*} fun
		 * @param {Array|null} [param]
		 * @param {*} [defaultValue]
		 * @returns {*}
		 */
		apply: function (fun, param, defaultValue) {
			if ((typeof fun) == "function") {
				return fun.apply(zt, param ? param : []);
			}

			return defaultValue;
		},

		/**
		 * check if node could do async action
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @returns {boolean|*}
		 */
		canAsync: function (setting, node) {
			var childKey = setting.data.key.children;
			return (setting.async.enable
			&& node
			&& node.isParent
			&& !(node.zAsync || (node[childKey] && node[childKey].length > 0)));
		},

		/**
		 * deeply clone the target object, this is just for simple object,
		 * do not support circular structure, prototype cloning
		 *
		 * this part is variant from
		 * http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
		 * @param {Object} obj
		 * @returns {*}
		 */
		clone: function clone(obj) {
			var copy;

			// Handle the 3 simple types, and null or undefined
			if (null == obj || "object" !== typeof obj) {
				return obj;
			}

			// Handle Date
			if (obj instanceof Date) {
				copy = new Date();
				copy.setTime(obj.getTime());
				return copy;
			}

			// Handle Array
			if (obj instanceof Array) {
				copy = [];
				for (var i = 0, len = obj.length; i < len; i++) {
					copy[i] = clone(obj[i]);
				}
				return copy;
			}

			// Handle Object
			if (obj instanceof Object) {
				copy = {};
				for (var attr in obj) {
					if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
				}
				return copy;
			}

			throw new Error("Unable to copy obj! Its type isn't supported.");
		},

		/**
		 * test if two lowercased strings were identical
		 * @param {String} str1
		 * @param {String} str2
		 * @returns {boolean}
		 */
		eqs: function (str1, str2) {
			return str1.toLowerCase() === str2.toLowerCase();
		},

		/**
		 * test if the target value is Array
		 * @param {*} arr
		 * @returns {boolean}
		 */
		isArray: function (arr) {
			return Object.prototype.toString.apply(arr) === "[object Array]";
		},

		/**
		 * wrapped jquery's query function with possible context
		 * @param {TreeNode} node
		 * @param {String} [exp]
		 * @param {ZTreeSetting} setting
		 * @returns {*|jQuery|HTMLElement}
		 */
		$: function (node, exp, setting) {
			// if no exp as string, consider it as setting
			if (!!exp && typeof exp != "string") {
				setting = exp;
				exp = "";
			}

			if (typeof node == "string") {
				return $(node, setting ? setting.treeObj.get(0).ownerDocument : null);
			} else {
				return $("#" + node.tId + exp, setting ? setting.treeObj : null);
			}
		},

		/**
		 * back traverse from the target dom node to find the parent node
		 * with attribute matching the expression
		 * @param setting
		 * @param {Element|Node} currentDom
		 * @param {Array<{tagName:String, attrName: string}>}targetExpr
		 * @returns {*}
		 */
		getMatchDom: function (setting, currentDom, targetExpr) {
			if (!currentDom) return null;

			while (currentDom && currentDom.id !== setting.treeId) {
				for (var i = 0, l = targetExpr.length; currentDom.tagName && i < l; i++) {
					if (tools.eqs(currentDom.tagName, targetExpr[i].tagName) && currentDom.getAttribute(targetExpr[i].attrName) !== null) {
						return currentDom;
					}
				}
				currentDom = currentDom.parentNode;
			}
			return null;
		},

		/**
		 * get the dom container element of the node, usually a ul element
		 * @param target
		 * @returns {*|jQuery}
		 */
		getNodeMainDom: function (target) {
			return ($(target).parent("li").get(0) || $(target).parentsUntil("li").parent().get(0));
		},

		/**
		 * check if the dom node is itself or the child of the element with
		 * parentId as id
		 *
		 * mainly for checking if cursor position is inside the target
		 * container
		 *
		 * @param dom
		 * @param parentId
		 * @returns {boolean}
		 */
		isChildOrSelf: function (dom, parentId) {
			return ( $(dom).closest("#" + parentId).length > 0 );
		},

		/**
		 * custom predicate to filter some control
		 *
		 * todo: this is a big non-sense, hard to explain what it does
		 * @param setting
		 * @param [event]
		 * @returns {boolean}
		 */
		uCanDo: function (setting, event) {
			return true;
		}
	};
	var view = {
		/**
		 * add new nodes to the parent node as children with target index
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode}parentNode
		 * @param {Number} index
		 * @param {Array<Node>} [newNodes]
		 * @param {Boolean} [isSilent] if auto expand the parentNode
		 */
		addNodes: function (setting, parentNode, index, newNodes, isSilent) {
			// here is tricky, if no leaf is locked, it's free to add
			// nodes,
			// if leaf is locked, and the parentNode is not a predefined
			// parent node, forbid addition
			if (setting.data.keep.leaf && parentNode && !parentNode.isParent) {
				return;
			}

			// transform data for processing
			if (!tools.isArray(newNodes)) {
				newNodes = [newNodes];
			}

			if (setting.data.simpleData.enable) {
				newNodes = data.transformTozTreeFormat(setting, newNodes);
			}

			// parent node exists, then add to it children
			if (parentNode) {
				var target_switchObj = $$(parentNode, consts.id.SWITCH, setting);
				var target_icoObj = $$(parentNode, consts.id.ICON, setting);
				var target_ulObj = $$(parentNode, consts.id.UL, setting);

				// if parentNode is not open, then update its elements'
				// class or style
				if (!parentNode.open) {
					view.replaceSwitchClass(parentNode, target_switchObj, consts.folder.CLOSE);
					view.replaceIconClass(parentNode, target_icoObj, consts.folder.CLOSE);
					// todo: is this redundant?
					parentNode.open = false;
					target_ulObj.css({
						"display": "none"
					});
				}

				data.addNodesData(setting, parentNode, index, newNodes);
				view.createNodes(setting, parentNode.level + 1, newNodes, parentNode, index);

				if (!isSilent) {
					view.expandCollapseParentNode(setting, parentNode, true);
				}
			}
			// doesn't exist, then add to the root's children
			else {
				data.addNodesData(setting, data.getRoot(setting), index, newNodes);
				view.createNodes(setting, 0, newNodes, null, index);

				// todo: does it need to expand the root?
			}
		},

		/**
		 * recursively construct the html string (subtree representing the
		 * nodes)
		 * @param setting
		 * @param level
		 * @param nodes
		 * @param parentNode
		 * @param insertIndex
		 * @param initFlag
		 * @param openFlag
		 * @returns {Array}
		 */
		appendNodes: function (setting, level, nodes, parentNode, insertIndex, initFlag, openFlag) {
			if (!nodes) return [];

			// the array to store the html fragment string, it will be
			// returned and joined later.
			var html = [];
			var childKey = setting.data.key.children;

			/* todo: although checking is a safe action, but obviously this is a low level util, some checking may have been done by top level calling. */
			var tmpParentNode = parentNode ? parentNode : data.getRoot(setting);
			var tmpChildren = tmpParentNode[childKey];

			// if children array not exist
			// or index exceed the children array's length
			if (!tmpChildren || insertIndex >= tmpChildren.length) {
				insertIndex = -1;
			}

			for (var i = 0, length = nodes.length; i < length; i++) {
				var node = nodes[i];

				// need to transform data node to tree node
				if (initFlag) {
					var isFirstNode = ((insertIndex === 0 || tmpChildren.length == nodes.length) && (i == 0));
					var isLastNode = (insertIndex < 0 && i == (nodes.length - 1));
					data.initNode(setting, level, node, parentNode, isFirstNode, isLastNode, openFlag);
					data.addNodeCache(setting, node);
				}

				var childHtml = [];

				// have more than 0 children
				if (node[childKey] && node[childKey].length > 0) {
					// make child html first, because of checkType
					// inheritance
					childHtml = view.appendNodes(setting, level + 1, node[childKey], node, -1, initFlag, openFlag && node.open);
				}

				// the parent node is opened
				if (openFlag) {

					view.makeDOMNodeMainBefore(html, setting, node);
					view.makeDOMNodeLine(html, setting, node);

					// currently used by exCheck module
					data.getBeforeA(setting, node, html);
					view.makeDOMNodeNameBefore(html, setting, node);

					// currently unused
					data.getInnerBeforeA(setting, node, html);

					view.makeDOMNodeIcon(html, setting, node);

					// currently unused
					data.getInnerAfterA(setting, node, html);

					view.makeDOMNodeNameAfter(html, setting, node);

					// currently unused
					data.getAfterA(setting, node, html);

					// append children html string
					if (node.isParent && node.open) {
						view.makeUlHtml(setting, node, html, childHtml.join(''));
					}

					view.makeDOMNodeMainAfter(html, setting, node);

					data.addCreatedNode(setting, node);
				}
			}
			return html;
		},

		/**
		 * append ul element as container for children of the target node,
		 * may recursively append from the ancestors if not exist
		 * @param setting
		 * @param node
		 */
		appendChildrenULDom: function (setting, node) {
			var html = [];
			var nodeElem = $$(node, setting);

			// node element doesn't exist and it has parent, then append
			// its parent
			if (!nodeElem.get(0) && !!node.parentTId) {
				view.appendChildrenULDom(setting, node.getParentNode());
				nodeElem = $$(node, setting);
			}

			// if children container exists, remove it
			var ulElem = $$(node, consts.id.UL, setting);
			if (ulElem.get(0)) {
				ulElem.remove();
			}

			var childKey = setting.data.key.children;
			var childHtml = view.appendNodes(setting, node.level + 1, node[childKey], node, -1, false, true);

			view.makeUlHtml(setting, node, html, childHtml.join(''));
			nodeElem.append(html.join(''));
		},

		/**
		 * asynchronously request data from remote address, then append
		 * that data to the tree
		 *
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} [node]
		 * @param {Boolean} [isSilent]
		 * @param {Function} [callback]
		 * @returns {boolean}
		 */
		asyncNode: function (setting, node, isSilent, callback) {
			var i;
			var length;

			// not parent node can't do async
			if (node && !node.isParent) {
				tools.apply(callback);
				return false;
			}
			// avoid repeat call
			else if (node && node.isAjaxing) {
				return false;
			}
			// if beforeAsync hook return false, stop async
			else if (tools.apply(setting.callback.beforeAsync, [setting.treeId, node], true) == false) {
				tools.apply(callback);
				return false;
			}

			var tmpParam = {};

			// if node exists, set loading style, and set up query
			// parameters Otherwise means it's the very first
			// initialization, no any data.
			if (node) {
				node.isAjaxing = true;
				var icoObj = $$(node, consts.id.ICON, setting);
				icoObj.attr({
					"style": "",
					"class": consts.className.BUTTON + " " + consts.className.ICO_LOADING
				});

				// automatically set request param from setting
				// i.e.: autoParam: ['id'] => {id: node[id]}, ['id=zId'] =>
				// {zId: node[id]} In short, it creates a mapping of data
				// structure between backend and frontend
				for (i = 0, length = setting.async.autoParam.length; i < length; i++) {
					var publicKey = setting.async.autoParam[i].split("=");
					var serverPublicKey = publicKey;

					if (publicKey.length > 1) {
						serverPublicKey = publicKey[1];
						publicKey = publicKey[0];
					}

					// here is some tricky
					// if the origin is something like ['id'], that will
					// cause `publicKey === serverPublicKey === ['id']`. Be
					// aware that the value is an array. But because Object
					// in JavaScript only has string and Symbol(ES6,ignore
					// it) as key. So, everything you want to define as key,
					// will be converted to string first.
					// ['id'].toString() => 'id'
					tmpParam[serverPublicKey] = node[publicKey];
				}
			}

			// array format otherParam must be like [key, value, key,
			// value,....] todo: array format is wired, should be abandoned
			if (tools.isArray(setting.async.otherParam)) {
				for (i = 0, length = setting.async.otherParam.length; i < length; i += 2) {
					tmpParam[setting.async.otherParam[i]] = setting.async.otherParam[i + 1];
				}
			} else {
				for (var p in setting.async.otherParam) {
					tmpParam[p] = setting.async.otherParam[p];
				}
			}

			var _tmpV = data.getRoot(setting)._ver;
			$.ajax({
				contentType: setting.async.contentType,
				cache: false,
				type: setting.async.type,
				url: tools.apply(setting.async.url, [setting.treeId, node], setting.async.url),
				data: tmpParam,
				dataType: setting.async.dataType,
				success: function (msg) {
					// todo: is this checking necessary?
					if (_tmpV != data.getRoot(setting)._ver) {
						return;
					}

					var newNodes = [];

					try {
						if (!msg || msg.length == 0) {
							newNodes = [];
						} else if (typeof msg == "string") {
							// todo: this is dangerous, should be abandoned
							newNodes = eval("(" + msg + ")");
						} else {
							newNodes = msg;
						}
					}
					catch (err) {
						newNodes = msg;
					}

					// turn off the flag so that other request can go on
					if (node) {
						node.isAjaxing = null;

						// tag the node has been loaded asynchronously
						node.zAsync = true;
					}

					view.setNodeLineIcons(setting, node);

					// response data not empty
					if (newNodes && newNodes !== "") {
						// tranform it with dataFilter in setting
						newNodes = tools.apply(setting.async.dataFilter, [setting.treeId, node, newNodes], newNodes);
						view.addNodes(setting, node, -1, !!newNodes ? tools.clone(newNodes) : [], !!isSilent);
					} else {
						view.addNodes(setting, node, -1, [], !!isSilent);
					}

					setting.treeObj.trigger(consts.event.ASYNC_SUCCESS, [setting.treeId, node, msg]);
					tools.apply(callback);
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					if (_tmpV != data.getRoot(setting)._ver) {
						return;
					}

					if (node) {
						node.isAjaxing = null;
					}

					view.setNodeLineIcons(setting, node);
					setting.treeObj.trigger(consts.event.ASYNC_ERROR, [setting.treeId, node, XMLHttpRequest, textStatus, errorThrown]);

					// todo: does it need to invoke callback here?
				}
			});

			return true;
		},

		/**
		 * cancel the selected state of target node
		 *
		 * @param setting
		 * @param node
		 * @param excludeNode
		 */
		cancelPreSelectedNode: function (setting, node, excludeNode) {
			var list = data.getRoot(setting).curSelectedList;
			var tmpNode;

			for (var i = list.length - 1; i >= 0; i--) {
				tmpNode = list[i];

				if (node === tmpNode) {
					$$(tmpNode, consts.id.A, setting).removeClass(consts.node.CURSELECTED);
					data.removeSelectedNode(setting, node);
					break;
				}
				// only if no node then test exclude
				// todo: is `!excludeNode` necessary
				else if (!node && (!excludeNode || excludeNode !== tmpNode)) {
					$$(tmpNode, consts.id.A, setting).removeClass(consts.node.CURSELECTED);
					list.splice(i, 1);
					setting.treeObj.trigger(consts.event.UNSELECTED, [setting.treeId, tmpNode]);
				}
			}
		},

		/**
		 * callback after creating node, invoke addDiyDom, trigger
		 * NODECREATED
		 * @param setting
		 */
		createNodeCallback: function (setting) {
			// check if have any callback
			if (!!setting.callback.onNodeCreated || !!setting.view.addDiyDom) {
				var root = data.getRoot(setting);

				while (root.createdNodes.length > 0) {
					// todo: shift operation is expensive, should avoid
					var node = root.createdNodes.shift();
					tools.apply(setting.view.addDiyDom, [setting.treeId, node]);

					if (!!setting.callback.onNodeCreated) {
						setting.treeObj.trigger(consts.event.NODECREATED, [setting.treeId, node]);
					}
				}
			}
		},

		/**
		 * facade for creating child nodes of the parent node
		 * @param setting
		 * @param level
		 * @param nodes
		 * @param parentNode
		 * @param index
		 */
		createNodes: function (setting, level, nodes, parentNode, index) {
			if (!nodes || nodes.length == 0) return;

			var root = data.getRoot(setting);
			var childKey = setting.data.key.children;
			var openFlag = !parentNode
				|| parentNode.open
				|| !!$$(parentNode[childKey][0], setting).get(0);

			/* todo: is this useless, as it is defined in `_initRoot`? or somewhere else doesn't clean properly? */
			root.createdNodes = [];

			var childrenHtml = view.appendNodes(setting, level, nodes, parentNode, index, true, openFlag);
			var parentJqElem;
			var nextSiblingElem;

			// retrieve the parent element to insert html
			if (!parentNode) {
				// parentNode does not exist could be initialization or
				// appending to root
				parentJqElem = setting.treeObj;
			} else {
				var ulJqElem = $$(parentNode, consts.id.UL, setting);

				if (ulJqElem.get(0)) {
					parentJqElem = ulJqElem;
				}
			}

			// todo: does it need checking parentElem existence?
			if (parentJqElem) {
				// if has target insert index, and the nextSiblingElem
				// exists, insert before target
				if (index >= 0 && (nextSiblingElem = parentJqElem.children()[index])) {
					$(nextSiblingElem).before(childrenHtml.join(''));
				}
				// otherwise append
				else {
					parentJqElem.append(childrenHtml.join(''));
				}
			}

			view.createNodeCallback(setting);
		},

		/**
		 * destroy the tree on view and do some cleaning
		 * @param setting
		 */
		destroy: function (setting) {
			if (!setting) return;

			data.initCache(setting);
			data.initRoot(setting);
			event.unbindTree(setting);
			event.unbindEvent(setting);
			setting.treeObj.empty();
			delete settings[setting.treeId];
		},

		/**
		 * expand or collapse the target node
		 * @param {ZTreeSetting} setting
		 * @param {TreeNode} node
		 * @param {Boolean} expandFlag
		 * @param {Boolean} [animateFlag]
		 * @param {Function} [callback]
		 */
		expandCollapseNode: function (setting, node, expandFlag, animateFlag, callback) {
			var root = data.getRoot(setting);
			var childKey = setting.data.key.children;
			var _callback;

			if (!node) {
				tools.apply(callback, []);
				return;
			}

			// need to trigger listener then wrap callback
			if (root.expandTriggerFlag) {
				_callback = callback;
				callback = function () {
					if (_callback) _callback();
					if (node.open) {
						setting.treeObj.trigger(consts.event.EXPAND, [setting.treeId, node]);
					} else {
						setting.treeObj.trigger(consts.event.COLLAPSE, [setting.treeId, node]);
					}
				};
				root.expandTriggerFlag = false;
			}

			// Simply speaking, if node isn't open and its children are
			// initiated, then append its children
			if (!node.open
				&& node.isParent
				&& (
					(!$$(node, consts.id.UL, setting).get(0))
					|| (
						node[childKey]
						&& node[childKey].length > 0
						&& !$$(node[childKey][0], setting).get(0)
					)
				)
			) {
				view.appendChildrenULDom(setting, node);
				view.createNodeCallback(setting);
			}

			// if node's open state met with target expandFlag, just invoke
			// callback and do nothing
			if (node.open == expandFlag) {
				tools.apply(callback, []);
				return;
			}

			var ulObj = $$(node, consts.id.UL, setting);
			var switchObj = $$(node, consts.id.SWITCH, setting);
			var icoObj = $$(node, consts.id.ICON, setting);

			// node should be parent, then could be operated
			if (node.isParent) {
				node.open = !node.open;

				// update icon inline style
				if (node.iconOpen && node.iconClose) {
					icoObj.attr("style", view.makeNodeIconStyle(setting, node));
				}

				// if open then show the children
				if (node.open) {
					view.replaceSwitchClass(node, switchObj, consts.folder.OPEN);
					view.replaceIconClass(node, icoObj, consts.folder.OPEN);

					if (animateFlag
						&& setting.view.expandSpeed
						&& (node[childKey] && node[childKey].length > 0)
					) {
						ulObj.slideDown(setting.view.expandSpeed, callback);
					} else {
						ulObj.show();
						tools.apply(callback, []);
					}
				}
				// if not open then hide the children
				else {
					view.replaceSwitchClass(node, switchObj, consts.folder.CLOSE);
					view.replaceIconClass(node, icoObj, consts.folder.CLOSE);

					if (animateFlag
						&& setting.view.expandSpeed
						&& (node[childKey] && node[childKey].length > 0)
					) {
						ulObj.slideUp(setting.view.expandSpeed, callback);
					} else {
						ulObj.hide();
						tools.apply(callback, []);
					}
				}
			} else {
				tools.apply(callback, []);
			}
		},

		/**
		 * expand or collapse parent node of the target node
		 * @param setting
		 * @param node
		 * @param expandFlag
		 * @param animateFlag
		 * @param callback
		 */
		expandCollapseParentNode: function (setting, node, expandFlag, animateFlag, callback) {
			if (!node) return;

			if (node.parentTId) {
				view.expandCollapseNode(setting, node, expandFlag, animateFlag);

				// as child is expanded, its ancestors should be expanded
				// too, and until to the top level then invoke the callback
				view.expandCollapseParentNode(setting, node.getParentNode(), expandFlag, animateFlag, callback);
			} else {
				view.expandCollapseNode(setting, node, expandFlag, animateFlag, callback);
			}
		},

		/**
		 * expand or collapse child nodes of the target node
		 * @param setting
		 * @param node
		 * @param expandFlag
		 * @param animateFlag
		 * @param callback
		 */
		expandCollapseChildNodes: function (setting, node, expandFlag, animateFlag, callback) {
			var root = data.getRoot(setting);
			var childKey = setting.data.key.children;
			var treeNodes = (node) ? node[childKey] : root[childKey];
			var selfAnimateFlag = (node) ? false : animateFlag;
			var expandTriggerFlag = root.expandTriggerFlag;

			root.expandTriggerFlag = false;
			if (treeNodes) {
				for (var i = 0, l = treeNodes.length; i < l; i++) {
					if (treeNodes[i]) view.expandCollapseChildNodes(setting, treeNodes[i], expandFlag, selfAnimateFlag);
				}
			}
			root.expandTriggerFlag = expandTriggerFlag;
			view.expandCollapseNode(setting, node, expandFlag, animateFlag, callback);
		},

		/**
		 * check if the node is selected
		 * @param setting
		 * @param node
		 * @returns {boolean}
		 */
		isSelectedNode: function (setting, node) {
			if (!node) return false;

			var list = data.getRoot(setting).curSelectedList;
			var index;

			for (index = list.length - 1; index >= 0; index--) {
				if (node === list[index]) return true;
			}

			return false;
		},

		/**
		 * construct the html string representing the icon element
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeIcon: function (html, setting, node) {
			var nameStr = data.getNodeName(setting, node);

			// escape the html
			var name = setting.view.nameIsHTML ? nameStr : nameStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

			html.push("<span id='", node.tId, consts.id.ICON,
				"' title='' treeNode", consts.id.ICON, " class='", view.makeNodeIconClass(setting, node),
				"' style='", view.makeNodeIconStyle(setting, node), "'></span><span id='", node.tId, consts.id.SPAN,
				"' class='", consts.className.NAME,
				"'>", name, "</span>");
		},

		/**
		 * construct the html string representing the switch element or the
		 * line element if no children
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeLine: function (html, setting, node) {
			html.push("<span id='", node.tId, consts.id.SWITCH, "' title='' class='", view.makeNodeLineClass(setting, node), "' treeNode", consts.id.SWITCH, "></span>");
		},

		/**
		 * start the html string array representing the whole node element
		 * it means add the start tag of the container which is actually
		 * `li` element
		 *
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeMainBefore: function (html, setting, node) {
			html.push("<li id='", node.tId, "' class='", consts.className.LEVEL, node.level, "' tabindex='0' hidefocus='true' treenode>");
		},

		/**
		 * enclose the html string array representing the whole node
		 * element
		 * it means add the end tag of the container which is actually `li`
		 * element
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeMainAfter: function (html, setting, node) {
			html.push("</li>");
		},

		/**
		 * start the html string array representing the node name
		 *
		 * it means add the start tag of the container which is actually
		 * `a` element
		 *
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeNameBefore: function (html, setting, node) {
			var title = data.getNodeTitle(setting, node);
			var url = view.makeNodeUrl(setting, node);
			var fontcss = view.makeNodeFontCss(setting, node);
			var fontStyle = [];

			for (var f in fontcss) {
				if (fontcss.hasOwnProperty(f)) fontStyle.push(f, ":", fontcss[f], ";");
			}

			/* todo: here are some weird usage, using single quote for html attributes */
			html.push("<a id='", node.tId, consts.id.A, "' class='", consts.className.LEVEL, node.level, "' treeNode", consts.id.A, " onclick=\"", (node.click || ''), "\" ", ((url != null && url.length > 0) ? "href='" + url + "'" : ""), " target='", view.makeNodeTarget(node), "' style='", fontStyle.join(''), "'");

			if (tools.apply(setting.view.showTitle, [setting.treeId, node], setting.view.showTitle) && title) {
				// escape html
				html.push("title='", title.replace(/'/g, "&#39;").replace(/</g, '&lt;').replace(/>/g, '&gt;'), "'");
			}

			html.push(">");
		},

		/**
		 * enclose the html string array representing the node name
		 *
		 * it means add the end tag of the container which is actually
		 * `a` element
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeNameAfter: function (html, setting, node) {
			html.push("</a>");
		},

		/**
		 * construct the font style configured by user for the node
		 * @param setting
		 * @param node
		 * @returns {{}}
		 */
		makeNodeFontCss: function (setting, node) {
			var fontCss = tools.apply(setting.view.fontCss, [setting.treeId, node], setting.view.fontCss);
			return (fontCss && ((typeof fontCss) != "function")) ? fontCss : {};
		},

		/**
		 * apply the icon class of the node
		 * @param setting
		 * @param node
		 * @returns {string}
		 */
		makeNodeIconClass: function (setting, node) {
			var icoCss = ["ico"];

			if (!node.isAjaxing) {
				icoCss[0] = (node.iconSkin ? node.iconSkin + "_" : "") + icoCss[0];
				if (node.isParent) {
					icoCss.push(node.open ? consts.folder.OPEN : consts.folder.CLOSE);
				} else {
					icoCss.push(consts.folder.DOCU);
				}
			}

			return consts.className.BUTTON + " " + icoCss.join('_');
		},

		/**
		 * apply the configured icon style of the node
		 * @param setting
		 * @param node
		 * @returns {string}
		 */
		makeNodeIconStyle: function (setting, node) {
			var iconStyle = [];

			if (!node.isAjaxing) {
				var icon = (node.isParent && node.iconOpen && node.iconClose) ?
					(node.open ? node.iconOpen : node.iconClose) :
					node[setting.data.key.icon];

				// set up the background image if configured in node
				// properties
				if (icon) iconStyle.push("background:url(", icon, ") 0 0 no-repeat;");

				if (setting.view.showIcon == false || !tools.apply(setting.view.showIcon, [setting.treeId, node], true)) {
					// todo: why don't use `display:none`?
					iconStyle.push("width:0px;height:0px;");
				}
			}

			return iconStyle.join('');
		},

		/**
		 * construct the classes of line element of the node
		 * @param setting
		 * @param node
		 * @returns {string}
		 */
		makeNodeLineClass: function (setting, node) {
			var lineClass = [];

			if (setting.view.showLine) {
				if (node.level == 0 && node.isFirstNode) {
					if (node.isLastNode) {
						lineClass.push(consts.line.ROOT);
					} else {
						lineClass.push(consts.line.ROOTS);
					}
				} else if (node.isLastNode) {
					lineClass.push(consts.line.BOTTOM);
				} else {
					lineClass.push(consts.line.CENTER);
				}
			} else {
				lineClass.push(consts.line.NOLINE);
			}

			if (node.isParent) {
				lineClass.push(node.open ? consts.folder.OPEN : consts.folder.CLOSE);
			} else {
				lineClass.push(consts.folder.DOCU);
			}

			return view.makeNodeLineClassEx(node) + lineClass.join('_');
		},

		/**
		 * construct the extra classes for the line element
		 * @param node
		 * @returns {string}
		 */
		makeNodeLineClassEx: function (node) {
			return consts.className.BUTTON + " " + consts.className.LEVEL + node.level + " " + consts.className.SWITCH + " ";
		},

		/**
		 * construct the target of a element of the node
		 * @param node
		 * @returns {*|string}
		 */
		makeNodeTarget: function (node) {
			return (node.target || "_blank");
		},

		/**
		 * construct the url of a element of the node
		 * @param setting
		 * @param node
		 * @returns {null}
		 */
		makeNodeUrl: function (setting, node) {
			var urlKey = setting.data.key.url;
			return node[urlKey] ? node[urlKey] : null;
		},

		/**
		 * construct the string representing the ul element(the container)
		 * @param setting
		 * @param html
		 * @param node
		 * @param content
		 */
		makeUlHtml: function (setting, node, html, content) {
			html.push("<ul id='", node.tId, consts.id.UL, "' class='", consts.className.LEVEL, node.level, " ", view.makeUlLineClass(setting, node), "' style='display:", (node.open ? "block" : "none"), "'>");
			html.push(content);
			html.push("</ul>");
		},

		/**
		 * construct the class of line element of ul container
		 * @param setting
		 * @param node
		 * @returns {string}
		 */
		makeUlLineClass: function (setting, node) {
			return ((setting.view.showLine && !node.isLastNode) ? consts.line.LINE : "");
		},

		/**
		 * remove child nodes from target node
		 * @param setting
		 * @param node
		 */
		removeChildNodes: function (setting, node) {
			if (!node) return;

			var childKey = setting.data.key.children;
			var nodes = node[childKey];

			if (!nodes) return;

			for (var i = 0, l = nodes.length; i < l; i++) {
				data.removeNodeCache(setting, nodes[i]);
			}

			// some deleted nodes have been selected
			data.removeSelectedNode(setting);
			delete node[childKey];

			// no need to lock as parent
			if (!setting.data.keep.parent) {
				node.isParent = false;
				node.open = false;

				var tmp_switchObj = $$(node, consts.id.SWITCH, setting);
				var tmp_icoObj = $$(node, consts.id.ICON, setting);

				view.replaceSwitchClass(node, tmp_switchObj, consts.folder.DOCU);
				view.replaceIconClass(node, tmp_icoObj, consts.folder.DOCU);
				$$(node, consts.id.UL, setting).remove();
			} else {
				$$(node, consts.id.UL, setting).empty();
			}
		},

		/**
		 * make the target dom scroll into view
		 * @param {Element} dom
		 */
		scrollIntoView: function (dom) {
			if (!dom) {
				return;
			}

			// webkit specific
			if (dom.scrollIntoViewIfNeeded) {
				dom.scrollIntoViewIfNeeded();
			}
			// standard usage
			else if (dom.scrollIntoView) {
				dom.scrollIntoView(false);
			} else {
				try {
					// html5 feature
					dom.focus().blur();
				}
				catch (e) {
				}
			}
		},

		/**
		 * tag the first child node of the node
		 * @param setting
		 * @param parentNode
		 */
		setFirstNode: function (setting, parentNode) {
			var childKey = setting.data.key.children;
			var childLength = parentNode[childKey].length;

			if (childLength > 0) {
				parentNode[childKey][0].isFirstNode = true;
			}
		},

		/**
		 * tag the last child node of the node
		 * @param setting
		 * @param parentNode
		 */
		setLastNode: function (setting, parentNode) {
			var childKey = setting.data.key.children;
			var childLength = parentNode[childKey].length;

			if (childLength > 0) {
				parentNode[childKey][childLength - 1].isLastNode = true;
			}
		},

		/**
		 * remove the target node form the tree
		 * @param setting
		 * @param node
		 */
		removeNode: function (setting, node) {
			var root = data.getRoot(setting);
			var childKey = setting.data.key.children;
			var parentNode = (node.parentTId) ? node.getParentNode() : root;

			node.isFirstNode = false;
			node.isLastNode = false;
			node.getPreNode = function () {return null;};
			node.getNextNode = function () {return null;};

			if (!data.getNodeCache(setting, node.tId)) {
				return;
			}

			$$(node, setting).remove();
			data.removeNodeCache(setting, node);
			data.removeSelectedNode(setting, node);

			// remove the target node from children array
			for (var i = 0, length = parentNode[childKey].length; i < length; i++) {
				if (parentNode[childKey][i].tId == node.tId) {
					parentNode[childKey].splice(i, 1);
					break;
				}
			}

			view.setFirstNode(setting, parentNode);
			view.setLastNode(setting, parentNode);

			var tmp_ulObj;
			var tmp_switchObj;
			var tmp_icoObj;
			var childLength = parentNode[childKey].length;

			// no need to keep as parent node, so remove its parent node's
			// feature
			if (!setting.data.keep.parent && childLength == 0) {
				// old parentNode has no child nodes
				parentNode.isParent = false;
				parentNode.open = false;
				tmp_ulObj = $$(parentNode, consts.id.UL, setting);
				tmp_switchObj = $$(parentNode, consts.id.SWITCH, setting);
				tmp_icoObj = $$(parentNode, consts.id.ICON, setting);
				view.replaceSwitchClass(parentNode, tmp_switchObj, consts.folder.DOCU);
				view.replaceIconClass(parentNode, tmp_icoObj, consts.folder.DOCU);
				tmp_ulObj.css("display", "none");

			} else if (setting.view.showLine && childLength > 0) {
				// old parentNode has child nodes
				var newLast = parentNode[childKey][childLength - 1];
				tmp_ulObj = $$(newLast, consts.id.UL, setting);
				tmp_switchObj = $$(newLast, consts.id.SWITCH, setting);
				tmp_icoObj = $$(newLast, consts.id.ICON, setting);

				if (parentNode == root) {
					// parentNode is root, and ztree has only one root
					// after removing node
					if (parentNode[childKey].length == 1) {
						view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.ROOT);
					}
					// ztree has multi root children
					else {
						var tmp_first_switchObj = $$(parentNode[childKey][0], consts.id.SWITCH, setting);
						view.replaceSwitchClass(parentNode[childKey][0], tmp_first_switchObj, consts.line.ROOTS);
						view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.BOTTOM);
					}
				} else {
					view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.BOTTOM);
				}

				// only useful when removing a node which is also a parent
				// node
				tmp_ulObj.removeClass(consts.line.LINE);
			}
		},

		/**
		 * replace the ico class
		 * i.e 'button ico_open' => 'button ico_${newName}'
		 * @param node
		 * @param obj
		 * @param newName
		 */
		replaceIconClass: function (node, obj, newName) {
			if (!obj || node.isAjaxing) return;

			var tmpName = obj.attr("class");

			if (tmpName == '') return;

			var tmpList = tmpName.split("_");

			switch (newName) {
				case consts.folder.OPEN:
				case consts.folder.CLOSE:
				case consts.folder.DOCU:
					tmpList[tmpList.length - 1] = newName;
					break;
			}

			obj.attr("class", tmpList.join("_"));
		},

		/**
		 * replace the class of switch icon
		 * i.e. '*** center_open' => '*** center_${newName}'
		 * @param node
		 * @param obj
		 * @param newName
		 */
		replaceSwitchClass: function (node, obj, newName) {
			if (!obj) return;

			var tmpName = obj.attr("class");

			if (tmpName == '') return;

			var tmpList = tmpName.split("_");

			switch (newName) {
				case consts.line.ROOT:
				case consts.line.ROOTS:
				case consts.line.CENTER:
				case consts.line.BOTTOM:
				case consts.line.NOLINE:
					tmpList[0] = view.makeNodeLineClassEx(node) + newName;
					break;
				case consts.folder.OPEN:
				case consts.folder.CLOSE:
				case consts.folder.DOCU:
					tmpList[1] = newName;
					break;
			}

			obj.attr("class", tmpList.join("_"));

			if (newName !== consts.folder.DOCU) {
				obj.removeAttr("disabled");
			} else {
				obj.attr("disabled", "disabled");
			}
		},

		/**
		 * activate the select state of the node
		 * @param setting
		 * @param node
		 * @param addFlag
		 */
		selectNode: function (setting, node, addFlag) {
			if (!addFlag) {
				view.cancelPreSelectedNode(setting, null, node);
			}

			$$(node, consts.id.A, setting).addClass(consts.node.CURSELECTED);
			data.addSelectedNode(setting, node);
			setting.treeObj.trigger(consts.event.SELECTED, [setting.treeId, node]);
		},

		/**
		 * apply the font style to the node
		 * @param setting
		 * @param treeNode
		 */
		setNodeFontCss: function (setting, treeNode) {
			var aObj = $$(treeNode, consts.id.A, setting);
			var fontCss = view.makeNodeFontCss(setting, treeNode);

			if (fontCss) {
				aObj.css(fontCss);
			}
		},

		/**
		 * apply the icon for the line element
		 * @param setting
		 * @param node
		 */
		setNodeLineIcons: function (setting, node) {
			if (!node) return;
			var switchObj = $$(node, consts.id.SWITCH, setting);
			var ulObj = $$(node, consts.id.UL, setting);
			var icoObj = $$(node, consts.id.ICON, setting);
			var ulLineClass = view.makeUlLineClass(setting, node);

			// if no need to show line, remove its class
			if (ulLineClass.length == 0) {
				ulObj.removeClass(consts.line.LINE);
			} else {
				ulObj.addClass(ulLineClass);
			}

			switchObj.attr("class", view.makeNodeLineClass(setting, node));

			if (node.isParent) {
				switchObj.removeAttr("disabled");
			} else {
				switchObj.attr("disabled", "disabled");
			}

			icoObj.removeAttr("style");
			icoObj.attr("style", view.makeNodeIconStyle(setting, node));
			icoObj.attr("class", view.makeNodeIconClass(setting, node));
		},

		/**
		 * apply the node name to its html
		 * @param setting
		 * @param node
		 */
		setNodeName: function (setting, node) {
			var title = data.getNodeTitle(setting, node);
			var nObj = $$(node, consts.id.SPAN, setting);

			nObj.empty();

			if (setting.view.nameIsHTML) {
				nObj.html(data.getNodeName(setting, node));
			} else {
				nObj.text(data.getNodeName(setting, node));
			}

			if (tools.apply(setting.view.showTitle, [setting.treeId, node], setting.view.showTitle)) {
				var aObj = $$(node, consts.id.A, setting);
				aObj.attr("title", !title ? "" : title);
			}
		},

		/**
		 * apply the target to node element
		 * @param setting
		 * @param node
		 */
		setNodeTarget: function (setting, node) {
			var aObj = $$(node, consts.id.A, setting);
			aObj.attr("target", view.makeNodeTarget(node));
		},

		/**
		 * apply the url to the node element
		 * @param setting
		 * @param node
		 */
		setNodeUrl: function (setting, node) {
			var aObj = $$(node, consts.id.A, setting);
			var url = view.makeNodeUrl(setting, node);

			if (url == null || url.length == 0) {
				aObj.removeAttr("href");
			} else {
				aObj.attr("href", url);
			}
		},

		/**
		 * toggle the node open state
		 * todo: some thing is weird here
		 * @param setting
		 * @param node
		 */
		switchNode: function (setting, node) {
			if (node.open || !tools.canAsync(setting, node)) {
				view.expandCollapseNode(setting, node, !node.open);
			} else if (setting.async.enable) {
				if (!view.asyncNode(setting, node)) {
					view.expandCollapseNode(setting, node, !node.open);
				}
			} else if (node) {
				view.expandCollapseNode(setting, node, !node.open);
			}
		}
	};
	// zTree defind
	$.fn.zTree = {
		consts: _consts,
		_z: {
			tools: tools,
			view: view,
			event: event,
			data: data
		},

		/**
		 * get the ztree tools to operate the tree
		 * @param treeId
		 * @returns {*}
		 */
		getZTreeObj: function (treeId) {
			var o = data.getZTreeTools(treeId);
			return o ? o : null;
		},

		/**
		 *  destroy a zTree by treeId, or destroy all zTree instances
		 * @param [treeId]
		 */
		destroy: function (treeId) {
			// todo: the condition should be simplified
			if (!!treeId && treeId.length > 0) {
				view.destroy(data.getSetting(treeId));
			} else {
				for (var s in settings) {
					view.destroy(settings[s]);
				}
			}
		},

		/**
		 * create a zTree
		 * @param jqElement
		 * @param userSetting
		 * @param dataNodes
		 * @returns {*}
		 */
		init: function (jqElement, userSetting, dataNodes) {
			// deep clone the default setting for independence
			var setting = tools.clone(defaultSetting);

			// deep merge the userSetting to the defaultSetting
			$.extend(true, setting, userSetting);

			// store reference of the tree element and clean its inner content
			setting.treeId = jqElement.attr("id");
			setting.treeObj = jqElement;
			setting.treeObj.empty();

			// cache the setting object
			settings[setting.treeId] = setting;

			// For some older browser,(e.g., ie6)
			// todo: to be removed
			if (typeof document.body.style.maxHeight === "undefined") {
				setting.view.expandSpeed = "";
			}

			// initiate the root object of the tree
			data.initRoot(setting);

			var root = data.getRoot(setting);
			var childKey = setting.data.key.children;

			// deep clone the data to avoid duplication with repeated
			// initialization?
			dataNodes = dataNodes ? tools.clone(tools.isArray(dataNodes) ? dataNodes : [dataNodes]) : [];

			// ensure the data is tree-like structure
			if (setting.data.simpleData.enable) {
				root[childKey] = data.transformTozTreeFormat(setting, dataNodes);
			} else {
				root[childKey] = dataNodes;
			}

			// initiate the cache functionality
			data.initCache(setting);

			// clean the event listeners on the tree element(related to DOM
			// events)
			event.unbindTree(setting);

			// initiate the event listeners on the tree element(related to DOM
			// events)
			event.bindTree(setting);

			// clean the event listeners (related to custom events)
			event.unbindEvent(setting);

			// initiate the event listeners (related to custom events)
			event.bindEvent(setting);

			/**
			 * zTreeTools is a collection of public functions for users,
			 * it's the zTreeObj from the user view.
			 */
			var zTreeTools = {
				setting: setting,

				/**
				 * add nodes to the tree under target parent
				 * @param parentNode
				 * @param index
				 * @param newNodes
				 * @param isSilent
				 * @returns {*}
				 */
				addNodes: function (parentNode, index, newNodes, isSilent) {
					if (!parentNode) parentNode = null;
					if (parentNode && !parentNode.isParent && setting.data.keep.leaf) return null;

					var i = parseInt(index, 10);

					if (isNaN(i)) {
						isSilent = !!newNodes;
						newNodes = index;
						index = -1;
					} else {
						index = i;
					}

					if (!newNodes) return null;

					var xNewNodes = tools.clone(tools.isArray(newNodes) ? newNodes : [newNodes]);

					function addCallback() {
						view.addNodes(setting, parentNode, index, xNewNodes, (isSilent == true));
					}

					if (tools.canAsync(setting, parentNode)) {
						view.asyncNode(setting, parentNode, isSilent, addCallback);
					} else {
						addCallback();
					}

					return xNewNodes;
				},

				/**
				 *
				 * @param node
				 */
				cancelSelectedNode: function (node) {
					view.cancelPreSelectedNode(setting, node);
				},

				/**
				 *
				 */
				destroy: function () {
					view.destroy(setting);
				},

				/**
				 *
				 * @param expandFlag
				 * @returns {boolean|*}
				 */
				expandAll: function (expandFlag) {
					expandFlag = !!expandFlag;
					view.expandCollapseChildNodes(setting, null, expandFlag, true);
					return expandFlag;
				},

				/**
				 *
				 * @param node
				 * @param expandFlag
				 * @param sonSign
				 * @param focus
				 * @param callbackFlag
				 * @returns {*}
				 */
				expandNode: function (node, expandFlag, sonSign, focus, callbackFlag) {
					if (!node || !node.isParent) return null;

					if (expandFlag !== true && expandFlag !== false) {
						expandFlag = !node.open;
					}

					callbackFlag = !!callbackFlag;

					if (callbackFlag
						&& expandFlag
						&& (tools.apply(setting.callback.beforeExpand, [setting.treeId, node], true) == false)
					) {
						return null;
					} else if (callbackFlag
						&& !expandFlag
						&& (tools.apply(setting.callback.beforeCollapse, [setting.treeId, node], true) == false)
					) {
						return null;
					}

					if (expandFlag && node.parentTId) {
						view.expandCollapseParentNode(setting, node.getParentNode(), expandFlag, false);
					}

					if (expandFlag === node.open && !sonSign) {
						return null;
					}

					data.getRoot(setting).expandTriggerFlag = callbackFlag;

					if (!tools.canAsync(setting, node) && sonSign) {
						view.expandCollapseChildNodes(setting, node, expandFlag, true, showNodeFocus);
					} else {
						node.open = !expandFlag;
						view.switchNode(this.setting, node);
						showNodeFocus();
					}

					return expandFlag;

					function showNodeFocus() {
						var a = $$(node, setting).get(0);
						if (a && focus !== false) {
							view.scrollIntoView(a);
						}
					}
				},

				/**
				 *
				 * @returns {*|Array.<TreeNode>}
				 */
				getNodes: function () {
					return data.getNodes(setting);
				},

				/**
				 *
				 * @param key
				 * @param value
				 * @param parentNode
				 * @returns {*}
				 */
				getNodeByParam: function (key, value, parentNode) {
					if (!key) return null;

					return data.getNodeByParam(setting,
						parentNode ?
							parentNode[setting.data.key.children] :
							data.getNodes(setting),
						key,
						value);
				},

				/**
				 *
				 * @param tId
				 * @returns {*|null}
				 */
				getNodeByTId: function (tId) {
					return data.getNodeCache(setting, tId);
				},

				/**
				 *
				 * @param key
				 * @param value
				 * @param parentNode
				 * @returns {*}
				 */
				getNodesByParam: function (key, value, parentNode) {
					if (!key) return null;

					return data.getNodesByParam(setting,
						parentNode ?
							parentNode[setting.data.key.children] :
							data.getNodes(setting),
						key,
						value);
				},

				/**
				 *
				 * @param key
				 * @param value
				 * @param parentNode
				 * @returns {*}
				 */
				getNodesByParamFuzzy: function (key, value, parentNode) {
					if (!key) return null;

					return data.getNodesByParamFuzzy(setting,
						parentNode ?
							parentNode[setting.data.key.children] :
							data.getNodes(setting),
						key,
						value);
				},

				/**
				 *
				 * @param filter
				 * @param isSingle
				 * @param parentNode
				 * @param invokeParam
				 * @returns {*}
				 */
				getNodesByFilter: function (filter, isSingle, parentNode, invokeParam) {
					isSingle = !!isSingle;

					if (!filter || (typeof filter != "function")) {
						return (isSingle ? null : []);
					}

					return data.getNodesByFilter(
						setting,
						parentNode ?
							parentNode[setting.data.key.children] :
							data.getNodes(setting),
						filter,
						isSingle,
						invokeParam);
				},

				/**
				 *
				 * @param node
				 * @returns {*}
				 */
				getNodeIndex: function (node) {
					if (!node) return null;

					var childKey = setting.data.key.children;
					var parentNode = (node.parentTId) ? node.getParentNode() : data.getRoot(setting);

					for (var i = 0, l = parentNode[childKey].length; i < l; i++) {
						if (parentNode[childKey][i] == node) return i;
					}

					return -1;
				},

				/**
				 *
				 * @returns {Array}
				 */
				getSelectedNodes: function () {
					var result = [];
					var list = data.getRoot(setting).curSelectedList;

					for (var i = 0, l = list.length; i < l; i++) {
						result.push(list[i]);
					}

					return result;
				},

				/**
				 *
				 * @param node
				 * @returns {*|boolean}
				 */
				isSelectedNode: function (node) {
					return data.isSelectedNode(setting, node);
				},

				/**
				 * reload the child nodes asynchronously
				 * @param parentNode
				 * @param reloadType
				 * @param isSilent
				 */
				reAsyncChildNodes: function (parentNode, reloadType, isSilent) {
					if (!this.setting.async.enable) return;

					var isRoot = !parentNode;

					if (isRoot) {
						parentNode = data.getRoot(setting);
					}

					if (reloadType == "refresh") {
						var childKey = this.setting.data.key.children;

						for (var i = 0, l = parentNode[childKey] ? parentNode[childKey].length : 0; i < l; i++) {
							data.removeNodeCache(setting, parentNode[childKey][i]);
						}

						data.removeSelectedNode(setting);
						parentNode[childKey] = [];

						if (isRoot) {
							this.setting.treeObj.empty();
						} else {
							var ulObj = $$(parentNode, consts.id.UL, setting);
							ulObj.empty();
						}
					}
					view.asyncNode(this.setting, isRoot ? null : parentNode, !!isSilent);
				},

				/**
				 * Refresh zTree
				 * If you have no special need, try not to use this method. If
				 * you refresh single node, please use updateNode() method. If
				 * you refresh child nodes in dynamic mode, please use the
				 * reAsyncChildNodes() method.
				 */
				refresh: function () {
					this.setting.treeObj.empty();
					var root = data.getRoot(setting)
					var nodes = root[setting.data.key.children];

					data.initRoot(setting);
					root[setting.data.key.children] = nodes
					data.initCache(setting);
					view.createNodes(setting, 0, root[setting.data.key.children], null, -1);
				},

				/**
				 *
				 * @param node
				 * @returns {null}
				 */
				removeChildNodes: function (node) {
					if (!node) return null;

					var childKey = setting.data.key.children;
					var nodes = node[childKey];

					view.removeChildNodes(setting, node);
					return nodes ? nodes : null;
				},

				/**
				 *
				 * @param node
				 * @param callbackFlag
				 */
				removeNode: function (node, callbackFlag) {
					if (!node) return;

					callbackFlag = !!callbackFlag;

					if (callbackFlag && tools.apply(setting.callback.beforeRemove, [setting.treeId, node], true) == false) return;

					view.removeNode(setting, node);

					if (callbackFlag) {
						this.setting.treeObj.trigger(consts.event.REMOVE, [setting.treeId, node]);
					}
				},

				/**
				 *
				 * @param node
				 * @param addFlag
				 * @param isSilent
				 */
				selectNode: function (node, addFlag, isSilent) {
					if (!node) return;

					if (tools.uCanDo(setting)) {
						addFlag = setting.view.selectedMulti && addFlag;

						if (node.parentTId) {
							view.expandCollapseParentNode(setting, node.getParentNode(), true, false, showNodeFocus);
						} else if (!isSilent) {
							try {
								$$(node, setting).focus().blur();
							}
							catch (e) {
							}
						}

						view.selectNode(setting, node, addFlag);
					}

					function showNodeFocus() {
						if (isSilent) return;


						var a = $$(node, setting).get(0);
						view.scrollIntoView(a);
					}
				},

				/**
				 *
				 * @param simpleNodes
				 * @returns {*|Array.<TreeNode>}
				 */
				transformTozTreeNodes: function (simpleNodes) {
					return data.transformTozTreeFormat(setting, simpleNodes);
				},

				/**
				 *
				 * @param nodes
				 * @returns {*|Array}
				 */
				transformToArray: function (nodes) {
					return data.transformToArrayFormat(setting, nodes);
				},

				/**
				 *
				 * @param node
				 * @param checkTypeFlag
				 */
				updateNode: function (node, checkTypeFlag) {
					if (!node) return;

					var nObj = $$(node, setting);

					if (nObj.get(0) && tools.uCanDo(setting)) {
						view.setNodeName(setting, node);
						view.setNodeTarget(setting, node);
						view.setNodeUrl(setting, node);
						view.setNodeLineIcons(setting, node);
						view.setNodeFontCss(setting, node);
					}
				}
			}

			root.treeTools = zTreeTools;

			// extend the zTreeTools from the registry
			data.setZTreeTools(setting, zTreeTools);

			// if the root node has children, create the child nodes
			if (root[childKey] && root[childKey].length > 0) {
				view.createNodes(setting, 0, root[childKey], null, -1);
			}
			// otherwise if async is enabled, fetch data from server and init
			// the tree
			else if (setting.async.enable && setting.async.url && setting.async.url !== '') {
				view.asyncNode(setting);
			}

			return zTreeTools;
		}
	};

	var zt = $.fn.zTree;
	var $$ = tools.$;
	var consts = zt.consts;
})(jQuery);
