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
	var settings = {}, roots = {}, caches = {},
		//default consts of core
		_consts = {
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
		},
		//default setting of core
		_setting = {
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
		},
		/**
		 * default root of core, zTree use root to save full data
		 * @param {ZTreeSetting} setting
		 * @private
		 */
		_initRoot = function (setting) {
			var r = data.getRoot(setting);
			if (!r) {
				r = {};
				data.setRoot(setting, r);
			}
			r[setting.data.key.children] = [];
			r.expandTriggerFlag = false;
			r.curSelectedList = [];
			r.noSelection = true;
			r.createdNodes = [];
			r.zId = 0;
			r._ver = (new Date()).getTime();
		},
		/**
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
		},
		/**
		 * default bindEvent of core
		 * @param {ZTreeSetting} setting
		 * @private
		 */
		_bindEvent = function (setting) {
			var o = setting.treeObj,
				c = consts.event;
			o.bind(c.NODECREATED, function (event, treeId, node) {
				tools.apply(setting.callback.onNodeCreated, [event, treeId, node]);
			});

			o.bind(c.CLICK, function (event, srcEvent, treeId, node, clickFlag) {
				tools.apply(setting.callback.onClick, [srcEvent, treeId, node, clickFlag]);
			});

			o.bind(c.EXPAND, function (event, treeId, node) {
				tools.apply(setting.callback.onExpand, [event, treeId, node]);
			});

			o.bind(c.COLLAPSE, function (event, treeId, node) {
				tools.apply(setting.callback.onCollapse, [event, treeId, node]);
			});

			o.bind(c.ASYNC_SUCCESS, function (event, treeId, node, msg) {
				tools.apply(setting.callback.onAsyncSuccess, [event, treeId, node, msg]);
			});

			o.bind(c.ASYNC_ERROR, function (event, treeId, node, XMLHttpRequest, textStatus, errorThrown) {
				tools.apply(setting.callback.onAsyncError, [event, treeId, node, XMLHttpRequest, textStatus, errorThrown]);
			});

			o.bind(c.REMOVE, function (event, treeId, treeNode) {
				tools.apply(setting.callback.onRemove, [event, treeId, treeNode]);
			});

			o.bind(c.SELECTED, function (event, treeId, node) {
				tools.apply(setting.callback.onSelected, [treeId, node]);
			});
			o.bind(c.UNSELECTED, function (event, treeId, node) {
				tools.apply(setting.callback.onUnSelected, [treeId, node]);
			});
		},
		/**
		 * default unbindEvent of core
		 * @param {ZTreeSetting} setting
		 * @private
		 */
		_unbindEvent = function (setting) {
			var o = setting.treeObj,
				c = consts.event;
			o.unbind(c.NODECREATED)
				.unbind(c.CLICK)
				.unbind(c.EXPAND)
				.unbind(c.COLLAPSE)
				.unbind(c.ASYNC_SUCCESS)
				.unbind(c.ASYNC_ERROR)
				.unbind(c.REMOVE)
				.unbind(c.SELECTED)
				.unbind(c.UNSELECTED);
		},
		/**
		 * default event proxy of core
		 * @param {Event} event
		 * @returns {ProxyResult}
		 * @private
		 */
		_eventProxy = function (event) {
			var target = event.target,
				setting = data.getSetting(event.data.treeId),
				tId = "", node = null,
				nodeEventType = "", treeEventType = "",
				nodeEventCallback = null, treeEventCallback = null,
				tmp = null;

			if (tools.eqs(event.type, "mousedown")) {
				treeEventType = "mousedown";
			} else if (tools.eqs(event.type, "mouseup")) {
				treeEventType = "mouseup";
			} else if (tools.eqs(event.type, "contextmenu")) {
				treeEventType = "contextmenu";
			} else if (tools.eqs(event.type, "click")) {
				if (tools.eqs(target.tagName, "span") && target.getAttribute("treeNode" + consts.id.SWITCH) !== null) {
					tId = tools.getNodeMainDom(target).id;
					nodeEventType = "switchNode";
				} else {
					tmp = tools.getMDom(setting, target, [{ tagName: "a", attrName: "treeNode" + consts.id.A }]);
					if (tmp) {
						tId = tools.getNodeMainDom(tmp).id;
						nodeEventType = "clickNode";
					}
				}
			} else if (tools.eqs(event.type, "dblclick")) {
				treeEventType = "dblclick";
				tmp = tools.getMDom(setting, target, [{ tagName: "a", attrName: "treeNode" + consts.id.A }]);
				if (tmp) {
					tId = tools.getNodeMainDom(tmp).id;
					nodeEventType = "switchNode";
				}
			}
			if (treeEventType.length > 0 && tId.length == 0) {
				tmp = tools.getMDom(setting, target, [{ tagName: "a", attrName: "treeNode" + consts.id.A }]);
				if (tmp) {
					tId = tools.getNodeMainDom(tmp).id;
				}
			}
			// event to node
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
			// event to zTree
			switch (treeEventType) {
				case "mousedown" :
					treeEventCallback = handler.onZTreeMousedown;
					break;
				case "mouseup" :
					treeEventCallback = handler.onZTreeMouseup;
					break;
				case "dblclick" :
					treeEventCallback = handler.onZTreeDblclick;
					break;
				case "contextmenu" :
					treeEventCallback = handler.onZTreeContextmenu;
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
		},
		/**
		 * default init node of core
		 * @param {ZTreeSetting} setting
		 * @param {Number} level
		 * @param {TreeNode} n
		 * @param {TreeNode} parentNode
		 * @param {Boolean} isFirstNode
		 * @param {Boolean} isLastNode
		 * @param {Boolean} openFlag
		 * @private
		 */
		_initNode = function (setting, level, n, parentNode, isFirstNode, isLastNode, openFlag) {
			if (!n) return;
			var r = data.getRoot(setting),
				childKey = setting.data.key.children;
			n.level = level;
			n.tId = setting.treeId + "_" + (++r.zId);
			n.parentTId = parentNode ? parentNode.tId : null;
			n.open = (typeof n.open == "string") ? tools.eqs(n.open, "true") : !!n.open;
			if (n[childKey] && n[childKey].length > 0) {
				n.isParent = true;
				n.zAsync = true;
			} else {
				n.isParent = (typeof n.isParent == "string") ? tools.eqs(n.isParent, "true") : !!n.isParent;
				n.open = (n.isParent && !setting.async.enable) ? n.open : false;
				n.zAsync = !n.isParent;
			}
			n.isFirstNode = isFirstNode;
			n.isLastNode = isLastNode;
			n.getParentNode = function () {return data.getNodeCache(setting, n.parentTId);};
			n.getPreNode = function () {return data.getPreNode(setting, n);};
			n.getNextNode = function () {return data.getNextNode(setting, n);};
			n.getIndex = function () {return data.getNodeIndex(setting, n);};
			n.getPath = function () {return data.getNodePath(setting, n);};
			n.isAjaxing = false;
			data.fixPIdKeyValue(setting, n);
		},
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
		},
		//method of operate data
		data = {
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
			 * add callback after appending node
			 * @param {Function} afterA
			 */
			addAfterA: function (afterA) {
				_init.afterA.push(afterA);
			},

			/**
			 * add callback before appending node
			 * @param {Function} beforeA
			 */
			addBeforeA: function (beforeA) {
				_init.beforeA.push(beforeA);
			},

			/**
			 * add callback before appending node inner content
			 * @param {Function} innerAfterA
			 */
			addInnerAfterA: function (innerAfterA) {
				_init.innerAfterA.push(innerAfterA);
			},

			/**
			 * add callback before appending node inner content
			 * @param {Function} innerBeforeA
			 */
			addInnerBeforeA: function (innerBeforeA) {
				_init.innerBeforeA.push(innerBeforeA);
			},

			/**
			 * add callback to bind events on init
			 * @param {Function<ZTreeSetting>} bindEvent
			 */
			addInitBind: function (bindEvent) {
				_init.bind.push(bindEvent);
			},

			/**
			 * add callback to unbind events on init
			 * @param {Function<ZTreeSetting>} unbindEvent
			 */
			addInitUnBind: function (unbindEvent) {
				_init.unbind.push(unbindEvent);
			},

			/**
			 * add handler to create cache on init
			 * @param { Function<String> } initCache
			 */
			addInitCache: function (initCache) {
				_init.caches.push(initCache);
			},

			/**
			 * add handler on node init
			 * @see _initNode
			 * @param {Function} initNode
			 */
			addInitNode: function (initNode) {
				_init.nodes.push(initNode);
			},

			/**
			 * add handler when proxy event
			 * @param {Function<Event>} initProxy
			 * @param {Boolean} isFirst
			 */
			addInitProxy: function (initProxy, isFirst) {
				if (!!isFirst) {
					_init.proxys.splice(0, 0, initProxy);
				} else {
					_init.proxys.push(initProxy);
				}
			},

			/**
			 * add handler when init root
			 * @param {Function<ZTreeSetting>} initRoot
			 */
			addInitRoot: function (initRoot) {
				_init.roots.push(initRoot);
			},

			/**
			 * add some custom data to the raw data nodes
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} parentNode
			 * @param {Number} index
			 * @param {Array<TreeNode>} nodes
			 */
			addNodesData: function (setting, parentNode, index, nodes) {
				var childKey = setting.data.key.children, params;
				if (!parentNode[childKey]) {
					parentNode[childKey] = [];
					index = -1;
				} else if (index >= parentNode[childKey].length) {
					index = -1;
				}

				if (parentNode[childKey].length > 0 && index === 0) {
					parentNode[childKey][0].isFirstNode = false;
					view.setNodeLineIcos(setting, parentNode[childKey][0]);
				} else if (parentNode[childKey].length > 0 && index < 0) {
					parentNode[childKey][parentNode[childKey].length - 1].isLastNode = false;
					view.setNodeLineIcos(setting, parentNode[childKey][parentNode[childKey].length - 1]);
				}
				parentNode.isParent = true;

				if (index < 0) {
					parentNode[childKey] = parentNode[childKey].concat(nodes);
				} else {
					params = [index, 0].concat(nodes);
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
				if (!!setting.callback.onNodeCreated || !!setting.view.addDiyDom) {
					var root = data.getRoot(setting);
					root.createdNodes.push(node);
				}
			},

			/**
			 * add handler to extend ZTreeTool
			 * @param zTreeTools
			 */
			addZTreeTools: function (zTreeTools) {
				_init.zTreeTools.push(zTreeTools);
			},

			/**
			 * extend the default setting with the source
			 * @param {Object} source
			 */
			exSetting: function (source) {
				$.extend(true, _setting, source);
			},

			/**
			 * set the pid key and value of the node with config in setting for zTree usage
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} node
			 */
			fixPIdKeyValue: function (setting, node) {
				if (setting.data.simpleData.enable) {
					node[setting.data.simpleData.pIdKey] = node.parentTId ? node.getParentNode()[setting.data.simpleData.idKey] : setting.data.simpleData.rootPId;
				}
			},

			/**
			 * invoke the callbacks after appending node
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
			 * invoke the callbacks before appending node
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
			 * invoke the callbacks after appending node inner content
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
			 * invoke the callbacks before appending node inner content
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
				var childKey = setting.data.key.children,
					p = node.parentTId ? node.getParentNode() : data.getRoot(setting);
				for (var i = 0, l = p[childKey].length - 1; i <= l; i++) {
					if (p[childKey][i] === node) {
						return i;
					}
				}
				return -1;
			},

			/**
			 * get the next brother node
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} node
			 * @returns {null}
			 */
			getNextNode: function (setting, node) {
				if (!node) return null;
				var childKey = setting.data.key.children,
					p = node.parentTId ? node.getParentNode() : data.getRoot(setting);
				for (var i = 0, l = p[childKey].length - 1; i <= l; i++) {
					if (p[childKey][i] === node) {
						return (i == l ? null : p[childKey][i + 1]);
					}
				}
				return null;
			},

			/**
			 * According to the node data attribute, search the node which exactly matches, and return the node object
			 *
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} nodes
			 * @param {String} key
			 * @param {String} value
			 * @returns {TreeNode|Null}
			 */
			getNodeByParam: function (setting, nodes, key, value) {
				if (!nodes || !key) return null;
				var childKey = setting.data.key.children;
				for (var i = 0, l = nodes.length; i < l; i++) {
					if (nodes[i][key] == value) {
						return nodes[i];
					}
					var tmp = data.getNodeByParam(setting, nodes[i][childKey], key, value);
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
				var n = caches[setting.treeId].nodes[data.getNodeCacheId(tId)];
				return n ? n : null;
			},

			/**
			 * get the name of the node
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} node
			 * @returns {string}
			 */
			getNodeName: function (setting, node) {
				var nameKey = setting.data.key.name;
				return "" + node[nameKey];
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
				var t = setting.data.key.title === "" ? setting.data.key.name : setting.data.key.title;
				return "" + node[t];
			},

			/**
			 * get all nodes of target tree
			 * @param {ZTreeSetting} setting
			 * @returns {Array<TreeNode>}
			 */
			getNodes: function (setting) {
				return data.getRoot(setting)[setting.data.key.children];
			},

			/**
			 * According to the node data attribute, search the nodes which exactly matches, and return the collection
			 * of node objects.
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} nodes
			 * @param {String} key
			 * @param {String} value
			 * @returns {Array<TreeNode>}
			 */
			getNodesByParam: function (setting, nodes, key, value) {
				if (!nodes || !key) return [];
				var childKey = setting.data.key.children,
					result = [];
				for (var i = 0, l = nodes.length; i < l; i++) {
					if (nodes[i][key] == value) {
						result.push(nodes[i]);
					}
					result = result.concat(data.getNodesByParam(setting, nodes[i][childKey], key, value));
				}
				return result;
			},

			/**
			 * According to the node data attribute, search the nodes which fuzzy matches, and return the collection of
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
				var childKey = setting.data.key.children,
					result = [];
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
			 * filter the nodes with the filter predicateFunc
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
				var childKey = setting.data.key.children,
					result = isSingle ? null : [];
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
			 * get the previous brother node
			 * @param {ZTreeSetting} setting
			 * @param {TreeNode} node
			 * @returns {TreeNode|null}
			 */
			getPreNode: function (setting, node) {
				if (!node) return null;
				var childKey = setting.data.key.children,
					p = node.parentTId ? node.getParentNode() : data.getRoot(setting);
				for (var i = 0, l = p[childKey].length; i < l; i++) {
					if (p[childKey][i] === node) {
						return (i == 0 ? null : p[childKey][i - 1]);
					}
				}
				return null;
			},

			/**
			 * get the root node
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
				var r = this.getRoot(this.getSetting(treeId));
				return r ? r.treeTools : null;
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
			 * check if the node was selected
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
			 * remove the node from cache, and recursively remove its child nodes
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
			 * @param {TreeNode} node
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
			 * @param {ZTreeSetting} setting
			 * @param zTreeTools
			 */
			setZTreeTools: function (setting, zTreeTools) {
				for (var i = 0, j = _init.zTreeTools.length; i < j; i++) {
					_init.zTreeTools[i].apply(this, arguments);
				}
			},

			/**
			 * transform the node tree to one dimension array
			 * @param {ZTreeSetting} setting
			 * @param {Array<TreeNode>} nodes
			 * @returns {Array}
			 */
			transformToArrayFormat: function (setting, nodes) {
				if (!nodes) return [];
				var childKey = setting.data.key.children,
					r = [];
				if (tools.isArray(nodes)) {
					for (var i = 0, l = nodes.length; i < l; i++) {
						r.push(nodes[i]);
						if (nodes[i][childKey])
							r = r.concat(data.transformToArrayFormat(setting, nodes[i][childKey]));
					}
				} else {
					r.push(nodes);
					if (nodes[childKey])
						r = r.concat(data.transformToArrayFormat(setting, nodes[childKey]));
				}
				return r;
			},

			/**
			 * transform the array nodes to tree structure
			 * @param {ZTreeSetting} setting
			 * @param {Array<TreeNode>}sNodes
			 * @returns {Array<TreeNode>}
			 */
			transformTozTreeFormat: function (setting, sNodes) {
				var i, l,
					key = setting.data.simpleData.idKey,
					parentKey = setting.data.simpleData.pIdKey,
					childKey = setting.data.key.children;
				if (!key || key == "" || !sNodes) return [];

				if (tools.isArray(sNodes)) {
					var r = [];
					var tmpMap = {};
					for (i = 0, l = sNodes.length; i < l; i++) {
						tmpMap[sNodes[i][key]] = sNodes[i];
					}
					for (i = 0, l = sNodes.length; i < l; i++) {
						if (tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
							if (!tmpMap[sNodes[i][parentKey]][childKey])
								tmpMap[sNodes[i][parentKey]][childKey] = [];
							tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i]);
						} else {
							r.push(sNodes[i]);
						}
					}
					return r;
				} else {
					return [sNodes];
				}
			}
		},
		//method of event proxy
		event = {
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
			 * bind events for proxy from the tree object
			 * @param setting
			 */
			bindTree: function (setting) {
				var eventParam = {
						treeId: setting.treeId
					},
					o = setting.treeObj;
				if (!setting.view.txtSelectedEnable) {
					// for can't select text
					o.bind('selectstart', handler.onSelectStart).css({
						"-moz-user-select": "-moz-none"
					});
				}
				o.bind('click', eventParam, event.proxy);
				o.bind('dblclick', eventParam, event.proxy);
				o.bind('mouseover', eventParam, event.proxy);
				o.bind('mouseout', eventParam, event.proxy);
				o.bind('mousedown', eventParam, event.proxy);
				o.bind('mouseup', eventParam, event.proxy);
				o.bind('contextmenu', eventParam, event.proxy);
			},

			/**
			 * unbind the proxyed events
			 * @param setting
			 */
			unbindTree: function (setting) {
				var o = setting.treeObj;
				o.unbind('selectstart', handler.onSelectStart)
					.unbind('click', event.proxy)
					.unbind('dblclick', event.proxy)
					.unbind('mouseover', event.proxy)
					.unbind('mouseout', event.proxy)
					.unbind('mousedown', event.proxy)
					.unbind('mouseup', event.proxy)
					.unbind('contextmenu', event.proxy);
			},

			/**
			 * invoke the proxy handlers
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
			 * the handler to call the proxyed handlers
			 * @param e
			 * @returns {boolean}
			 */
			proxy: function (e) {
				var setting = data.getSetting(e.data.treeId);
				if (!tools.uCanDo(setting, e)) return true;
				var results = event.doProxy(e),
					r = true, x = false;
				for (var i = 0, l = results.length; i < l; i++) {
					var proxyResult = results[i];
					if (proxyResult.nodeEventCallback) {
						x = true;
						r = proxyResult.nodeEventCallback.apply(proxyResult, [e, proxyResult.node]) && r;
					}
					if (proxyResult.treeEventCallback) {
						x = true;
						r = proxyResult.treeEventCallback.apply(proxyResult, [e, proxyResult.node]) && r;
					}
				}
				return r;
			}
		},
		//method of event handler
		handler = {
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
				var setting = data.getSetting(event.data.treeId),
					clickFlag = ( (setting.view.autoCancelSelected && (event.ctrlKey || event.metaKey)) && data.isSelectedNode(setting, node)) ? 0 : (setting.view.autoCancelSelected && (event.ctrlKey || event.metaKey) && setting.view.selectedMulti) ? 2 : 1;
				if (tools.apply(setting.callback.beforeClick, [setting.treeId, node, clickFlag], true) == false) return true;
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
			onZTreeMousedown: function (event, node) {
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
			onZTreeMouseup: function (event, node) {
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
			onZTreeDblclick: function (event, node) {
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
			onZTreeContextmenu: function (event, node) {
				var setting = data.getSetting(event.data.treeId);
				if (tools.apply(setting.callback.beforeRightClick, [setting.treeId, node], true)) {
					tools.apply(setting.callback.onRightClick, [event, setting.treeId, node]);
				}
				return (typeof setting.callback.onRightClick) != "function";
			},

			/**
			 * handler for select start
			 * @param e
			 * @returns {boolean}
			 */
			onSelectStart: function (e) {
				var n = e.originalEvent.srcElement.nodeName.toLowerCase();
				return (n === "input" || n === "textarea" );
			}
		},
		//method of tools for zTree
		tools = {
			/**
			 * apply the target function with ztree as context
			 * @param {Function} fun
			 * @param {*} param
			 * @param {*} defaultValue
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
				return (setting.async.enable && node && node.isParent && !(node.zAsync || (node[childKey] && node[childKey].length > 0)));
			},

			/**
			 * deeply clone the target object
			 * @param {Object} obj
			 * @returns {*}
			 */
			clone: function (obj) {
				if (obj === null) return null;
				var o = tools.isArray(obj) ? [] : {};
				for (var i in obj) {
					o[i] = (obj[i] instanceof Date) ? new Date(obj[i].getTime()) : (typeof obj[i] === "object" ? tools.clone(obj[i]) : obj[i]);
				}
				return o;
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
			 * test if the target value was Array
			 * @param {*} arr
			 * @returns {boolean}
			 */
			isArray: function (arr) {
				return Object.prototype.toString.apply(arr) === "[object Array]";
			},

			/**
			 * wrapped jquery's query function with possible context
			 * @param node
			 * @param exp
			 * @param setting
			 * @returns {*|jQuery|HTMLElement}
			 */
			$: function (node, exp, setting) {
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
			 * back traverse from the target dom node to find the parent node with attribute matching the expression
			 * @param setting
			 * @param curDom
			 * @param targetExpr
			 * @returns {*}
			 */
			getMDom: function (setting, curDom, targetExpr) {
				if (!curDom) return null;
				while (curDom && curDom.id !== setting.treeId) {
					for (var i = 0, l = targetExpr.length; curDom.tagName && i < l; i++) {
						if (tools.eqs(curDom.tagName, targetExpr[i].tagName) && curDom.getAttribute(targetExpr[i].attrName) !== null) {
							return curDom;
						}
					}
					curDom = curDom.parentNode;
				}
				return null;
			},

			/**
			 * get the dom node's tree node container
			 * @param target
			 * @returns {*|jQuery}
			 */
			getNodeMainDom: function (target) {
				return ($(target).parent("li").get(0) || $(target).parentsUntil("li").parent().get(0));
			},

			/**
			 * check if the dom node was itself or child with parentId
			 * @param dom
			 * @param parentId
			 * @returns {boolean}
			 */
			isChildOrSelf: function (dom, parentId) {
				return ( $(dom).closest("#" + parentId).length > 0 );
			},

			/**
			 *
			 * @param setting
			 * @param e
			 * @returns {boolean}
			 */
			uCanDo: function (setting, e) {
				return true;
			}
		},
		//method of operate ztree dom
		view = {

			addNodes: function (setting, parentNode, index, newNodes, isSilent) {
				/**
				 * add new nodes to the parent node as children with target index
				 * @param setting
				 * @param parentNode
				 * @param index
				 * @param newNodes
				 * @param isSilent
				 */
				if (setting.data.keep.leaf && parentNode && !parentNode.isParent) {
					return;
				}
				if (!tools.isArray(newNodes)) {
					newNodes = [newNodes];
				}
				if (setting.data.simpleData.enable) {
					newNodes = data.transformTozTreeFormat(setting, newNodes);
				}
				if (parentNode) {
					var target_switchObj = $$(parentNode, consts.id.SWITCH, setting),
						target_icoObj = $$(parentNode, consts.id.ICON, setting),
						target_ulObj = $$(parentNode, consts.id.UL, setting);

					if (!parentNode.open) {
						view.replaceSwitchClass(parentNode, target_switchObj, consts.folder.CLOSE);
						view.replaceIcoClass(parentNode, target_icoObj, consts.folder.CLOSE);
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
				} else {
					data.addNodesData(setting, data.getRoot(setting), index, newNodes);
					view.createNodes(setting, 0, newNodes, null, index);
				}
			},

			/**
			 * append nodes inside the parent node
			 * @param setting
			 * @param level
			 * @param nodes
			 * @param parentNode
			 * @param index
			 * @param initFlag
			 * @param openFlag
			 * @returns {Array}
			 */
			appendNodes: function (setting, level, nodes, parentNode, index, initFlag, openFlag) {
				if (!nodes) return [];
				var html = [],
					childKey = setting.data.key.children;

				var tmpPNode = (parentNode) ? parentNode : data.getRoot(setting),
					tmpPChild = tmpPNode[childKey],
					isFirstNode, isLastNode;

				if (!tmpPChild || index >= tmpPChild.length) {
					index = -1;
				}

				for (var i = 0, l = nodes.length; i < l; i++) {
					var node = nodes[i];
					if (initFlag) {
						isFirstNode = ((index === 0 || tmpPChild.length == nodes.length) && (i == 0));
						isLastNode = (index < 0 && i == (nodes.length - 1));
						data.initNode(setting, level, node, parentNode, isFirstNode, isLastNode, openFlag);
						data.addNodeCache(setting, node);
					}

					var childHtml = [];
					if (node[childKey] && node[childKey].length > 0) {
						//make child html first, because checkType
						childHtml = view.appendNodes(setting, level + 1, node[childKey], node, -1, initFlag, openFlag && node.open);
					}
					if (openFlag) {

						view.makeDOMNodeMainBefore(html, setting, node);
						view.makeDOMNodeLine(html, setting, node);
						data.getBeforeA(setting, node, html);
						view.makeDOMNodeNameBefore(html, setting, node);
						data.getInnerBeforeA(setting, node, html);
						view.makeDOMNodeIcon(html, setting, node);
						data.getInnerAfterA(setting, node, html);
						view.makeDOMNodeNameAfter(html, setting, node);
						data.getAfterA(setting, node, html);
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
			 * append ul element as container for children of the target node
			 * @param setting
			 * @param node
			 */
			appendParentULDom: function (setting, node) {
				var html = [],
					nObj = $$(node, setting);
				if (!nObj.get(0) && !!node.parentTId) {
					view.appendParentULDom(setting, node.getParentNode());
					nObj = $$(node, setting);
				}
				var ulObj = $$(node, consts.id.UL, setting);
				if (ulObj.get(0)) {
					ulObj.remove();
				}
				var childKey = setting.data.key.children,
					childHtml = view.appendNodes(setting, node.level + 1, node[childKey], node, -1, false, true);
				view.makeUlHtml(setting, node, html, childHtml.join(''));
				nObj.append(html.join(''));
			},

			/**
			 * add the remote data as new nodes asynchronously
			 * @param setting
			 * @param node
			 * @param isSilent
			 * @param callback
			 * @returns {boolean}
			 */
			asyncNode: function (setting, node, isSilent, callback) {
				var i, l;
				if (node && !node.isParent) {
					tools.apply(callback);
					return false;
				} else if (node && node.isAjaxing) {
					return false;
				} else if (tools.apply(setting.callback.beforeAsync, [setting.treeId, node], true) == false) {
					tools.apply(callback);
					return false;
				}
				if (node) {
					node.isAjaxing = true;
					var icoObj = $$(node, consts.id.ICON, setting);
					icoObj.attr({ "style": "", "class": consts.className.BUTTON + " " + consts.className.ICO_LOADING });
				}

				var tmpParam = {};
				for (i = 0, l = setting.async.autoParam.length; node && i < l; i++) {
					var pKey = setting.async.autoParam[i].split("="), spKey = pKey;
					if (pKey.length > 1) {
						spKey = pKey[1];
						pKey = pKey[0];
					}
					tmpParam[spKey] = node[pKey];
				}
				if (tools.isArray(setting.async.otherParam)) {
					for (i = 0, l = setting.async.otherParam.length; i < l; i += 2) {
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
						if (_tmpV != data.getRoot(setting)._ver) {
							return;
						}
						var newNodes = [];
						try {
							if (!msg || msg.length == 0) {
								newNodes = [];
							} else if (typeof msg == "string") {
								// todo: this is dangerous
								newNodes = eval("(" + msg + ")");
							} else {
								newNodes = msg;
							}
						} catch (err) {
							newNodes = msg;
						}

						if (node) {
							node.isAjaxing = null;
							node.zAsync = true;
						}
						view.setNodeLineIcos(setting, node);
						if (newNodes && newNodes !== "") {
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
						if (node) node.isAjaxing = null;
						view.setNodeLineIcos(setting, node);
						setting.treeObj.trigger(consts.event.ASYNC_ERROR, [setting.treeId, node, XMLHttpRequest, textStatus, errorThrown]);
					}
				});
				return true;
			},

			/**
			 * cancel the preselected state of target node
			 *
			 * @param setting
			 * @param node
			 * @param excludeNode
			 */
			cancelPreSelectedNode: function (setting, node, excludeNode) {
				var list = data.getRoot(setting).curSelectedList,
					i, n;
				for (i = list.length - 1; i >= 0; i--) {
					n = list[i];
					if (node === n || (!node && (!excludeNode || excludeNode !== n))) {
						$$(n, consts.id.A, setting).removeClass(consts.node.CURSELECTED);
						if (node) {
							data.removeSelectedNode(setting, node);
							break;
						} else {
							list.splice(i, 1);
							setting.treeObj.trigger(consts.event.UNSELECTED, [setting.treeId, n]);
						}
					}
				}
			},

			/**
			 * callback when creating node
			 * @param setting
			 */
			createNodeCallback: function (setting) {
				if (!!setting.callback.onNodeCreated || !!setting.view.addDiyDom) {
					var root = data.getRoot(setting);
					while (root.createdNodes.length > 0) {
						var node = root.createdNodes.shift();
						tools.apply(setting.view.addDiyDom, [setting.treeId, node]);
						if (!!setting.callback.onNodeCreated) {
							setting.treeObj.trigger(consts.event.NODECREATED, [setting.treeId, node]);
						}
					}
				}
			},

			/**
			 * facade for creating nodes of tree
			 * @param setting
			 * @param level
			 * @param nodes
			 * @param parentNode
			 * @param index
			 */
			createNodes: function (setting, level, nodes, parentNode, index) {
				if (!nodes || nodes.length == 0) return;
				var root = data.getRoot(setting),
					childKey = setting.data.key.children,
					openFlag = !parentNode || parentNode.open || !!$$(parentNode[childKey][0], setting).get(0);
				root.createdNodes = [];
				var zTreeHtml = view.appendNodes(setting, level, nodes, parentNode, index, true, openFlag),
					parentObj, nextObj;

				if (!parentNode) {
					parentObj = setting.treeObj;
					//setting.treeObj.append(zTreeHtml.join(''));
				} else {
					var ulObj = $$(parentNode, consts.id.UL, setting);
					if (ulObj.get(0)) {
						parentObj = ulObj;
						//ulObj.append(zTreeHtml.join(''));
					}
				}
				if (parentObj) {
					if (index >= 0) {
						nextObj = parentObj.children()[index];
					}
					if (index >= 0 && nextObj) {
						$(nextObj).before(zTreeHtml.join(''));
					} else {
						parentObj.append(zTreeHtml.join(''));
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
			 * @param setting
			 * @param node
			 * @param expandFlag
			 * @param animateFlag
			 * @param callback
			 */
			expandCollapseNode: function (setting, node, expandFlag, animateFlag, callback) {
				var root = data.getRoot(setting),
					childKey = setting.data.key.children;
				var tmpCb, _callback;
				if (!node) {
					tools.apply(callback, []);
					return;
				}
				if (root.expandTriggerFlag) {
					_callback = callback;
					tmpCb = function () {
						if (_callback) _callback();
						if (node.open) {
							setting.treeObj.trigger(consts.event.EXPAND, [setting.treeId, node]);
						} else {
							setting.treeObj.trigger(consts.event.COLLAPSE, [setting.treeId, node]);
						}
					};
					callback = tmpCb;
					root.expandTriggerFlag = false;
				}
				if (!node.open && node.isParent && ((!$$(node, consts.id.UL, setting).get(0)) || (node[childKey] && node[childKey].length > 0 && !$$(node[childKey][0], setting).get(0)))) {
					view.appendParentULDom(setting, node);
					view.createNodeCallback(setting);
				}
				if (node.open == expandFlag) {
					tools.apply(callback, []);
					return;
				}
				var ulObj = $$(node, consts.id.UL, setting),
					switchObj = $$(node, consts.id.SWITCH, setting),
					icoObj = $$(node, consts.id.ICON, setting);

				if (node.isParent) {
					node.open = !node.open;
					if (node.iconOpen && node.iconClose) {
						icoObj.attr("style", view.makeNodeIcoStyle(setting, node));
					}

					if (node.open) {
						view.replaceSwitchClass(node, switchObj, consts.folder.OPEN);
						view.replaceIcoClass(node, icoObj, consts.folder.OPEN);
						if (animateFlag == false || setting.view.expandSpeed == "") {
							ulObj.show();
							tools.apply(callback, []);
						} else {
							if (node[childKey] && node[childKey].length > 0) {
								ulObj.slideDown(setting.view.expandSpeed, callback);
							} else {
								ulObj.show();
								tools.apply(callback, []);
							}
						}
					} else {
						view.replaceSwitchClass(node, switchObj, consts.folder.CLOSE);
						view.replaceIcoClass(node, icoObj, consts.folder.CLOSE);
						if (animateFlag == false || setting.view.expandSpeed == "" || !(node[childKey] && node[childKey].length > 0)) {
							ulObj.hide();
							tools.apply(callback, []);
						} else {
							ulObj.slideUp(setting.view.expandSpeed, callback);
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
				if (!node.parentTId) {
					view.expandCollapseNode(setting, node, expandFlag, animateFlag, callback);
					return;
				} else {
					view.expandCollapseNode(setting, node, expandFlag, animateFlag);
				}
				if (node.parentTId) {
					view.expandCollapseParentNode(setting, node.getParentNode(), expandFlag, animateFlag, callback);
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
			expandCollapseSonNode: function (setting, node, expandFlag, animateFlag, callback) {
				var root = data.getRoot(setting),
					childKey = setting.data.key.children,
					treeNodes = (node) ? node[childKey] : root[childKey],
					selfAnimateSign = (node) ? false : animateFlag,
					expandTriggerFlag = data.getRoot(setting).expandTriggerFlag;
				data.getRoot(setting).expandTriggerFlag = false;
				if (treeNodes) {
					for (var i = 0, l = treeNodes.length; i < l; i++) {
						if (treeNodes[i]) view.expandCollapseSonNode(setting, treeNodes[i], expandFlag, selfAnimateSign);
					}
				}
				data.getRoot(setting).expandTriggerFlag = expandTriggerFlag;
				view.expandCollapseNode(setting, node, expandFlag, animateFlag, callback);
			},

			/**
			 * check if the node was selected
			 * @param setting
			 * @param node
			 * @returns {boolean}
			 */
			isSelectedNode: function (setting, node) {
				if (!node) {
					return false;
				}
				var list = data.getRoot(setting).curSelectedList,
					i;
				for (i = list.length - 1; i >= 0; i--) {
					if (node === list[i]) {
						return true;
					}
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
				var nameStr = data.getNodeName(setting, node),
					name = setting.view.nameIsHTML ? nameStr : nameStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				html.push("<span id='", node.tId, consts.id.ICON,
					"' title='' treeNode", consts.id.ICON, " class='", view.makeNodeIcoClass(setting, node),
					"' style='", view.makeNodeIcoStyle(setting, node), "'></span><span id='", node.tId, consts.id.SPAN,
					"' class='", consts.className.NAME,
					"'>", name, "</span>");
			},

			/**
			 * construct the html string representing the line element
			 * @param html
			 * @param setting
			 * @param node
			 */
			makeDOMNodeLine: function (html, setting, node) {
				html.push("<span id='", node.tId, consts.id.SWITCH, "' title='' class='", view.makeNodeLineClass(setting, node), "' treeNode", consts.id.SWITCH, "></span>");
			},

			/**
			 * enclose the string array representing the whole node element
			 * @param html
			 * @param setting
			 * @param node
			 */
			makeDOMNodeMainAfter: function (html, setting, node) {
				html.push("</li>");
			},

			/**
			 * start the string array representing the whole node element
			 * @param html
			 * @param setting
			 * @param node
			 */
			makeDOMNodeMainBefore: function (html, setting, node) {
				html.push("<li id='", node.tId, "' class='", consts.className.LEVEL, node.level, "' tabindex='0' hidefocus='true' treenode>");
			},

			/**
			 * enclose the string array representing the node name
			 * @param html
			 * @param setting
			 * @param node
			 */
			makeDOMNodeNameAfter: function (html, setting, node) {
				html.push("</a>");
			},

			/**
			 * start the string array representing the node name
			 * @param html
			 * @param setting
			 * @param node
			 */
			makeDOMNodeNameBefore: function (html, setting, node) {
				var title = data.getNodeTitle(setting, node),
					url = view.makeNodeUrl(setting, node),
					fontcss = view.makeNodeFontCss(setting, node),
					fontStyle = [];
				for (var f in fontcss) {
					fontStyle.push(f, ":", fontcss[f], ";");
				}
				html.push("<a id='", node.tId, consts.id.A, "' class='", consts.className.LEVEL, node.level, "' treeNode", consts.id.A, " onclick=\"", (node.click || ''),
					"\" ", ((url != null && url.length > 0) ? "href='" + url + "'" : ""), " target='", view.makeNodeTarget(node), "' style='", fontStyle.join(''),
					"'");
				if (tools.apply(setting.view.showTitle, [setting.treeId, node], setting.view.showTitle) && title) {
					html.push("title='", title.replace(/'/g, "&#39;").replace(/</g, '&lt;').replace(/>/g, '&gt;'), "'");
				}
				html.push(">");
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
			makeNodeIcoClass: function (setting, node) {
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
			makeNodeIcoStyle: function (setting, node) {
				var icoStyle = [];
				if (!node.isAjaxing) {
					var icon = (node.isParent && node.iconOpen && node.iconClose) ? (node.open ? node.iconOpen : node.iconClose) : node[setting.data.key.icon];
					if (icon) icoStyle.push("background:url(", icon, ") 0 0 no-repeat;");
					if (setting.view.showIcon == false || !tools.apply(setting.view.showIcon, [setting.treeId, node], true)) {
						icoStyle.push("width:0px;height:0px;");
					}
				}
				return icoStyle.join('');
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
					if (node.level == 0 && node.isFirstNode && node.isLastNode) {
						lineClass.push(consts.line.ROOT);
					} else if (node.level == 0 && node.isFirstNode) {
						lineClass.push(consts.line.ROOTS);
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
			 * construct the class of line element
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
				var childKey = setting.data.key.children,
					nodes = node[childKey];
				if (!nodes) return;

				for (var i = 0, l = nodes.length; i < l; i++) {
					data.removeNodeCache(setting, nodes[i]);
				}
				data.removeSelectedNode(setting);
				delete node[childKey];

				if (!setting.data.keep.parent) {
					node.isParent = false;
					node.open = false;
					var tmp_switchObj = $$(node, consts.id.SWITCH, setting),
						tmp_icoObj = $$(node, consts.id.ICON, setting);
					view.replaceSwitchClass(node, tmp_switchObj, consts.folder.DOCU);
					view.replaceIcoClass(node, tmp_icoObj, consts.folder.DOCU);
					$$(node, consts.id.UL, setting).remove();
				} else {
					$$(node, consts.id.UL, setting).empty();
				}
			},

			/**
			 * make the target dom scroll into view
			 * @param dom
			 */
			scrollIntoView: function (dom) {
				if (!dom) {
					return;
				}
				if (dom.scrollIntoViewIfNeeded) {
					dom.scrollIntoViewIfNeeded();
				} else if (dom.scrollIntoView) {
					dom.scrollIntoView(false);
				} else {
					try {
						dom.focus().blur();
					} catch (e) {
					}
				}
			},

			/**
			 * tag the first child node of the node
			 * @param setting
			 * @param parentNode
			 */
			setFirstNode: function (setting, parentNode) {
				var childKey = setting.data.key.children, childLength = parentNode[childKey].length;
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
				var childKey = setting.data.key.children, childLength = parentNode[childKey].length;
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
				var root = data.getRoot(setting),
					childKey = setting.data.key.children,
					parentNode = (node.parentTId) ? node.getParentNode() : root;

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

				for (var i = 0, l = parentNode[childKey].length; i < l; i++) {
					if (parentNode[childKey][i].tId == node.tId) {
						parentNode[childKey].splice(i, 1);
						break;
					}
				}
				view.setFirstNode(setting, parentNode);
				view.setLastNode(setting, parentNode);

				var tmp_ulObj, tmp_switchObj, tmp_icoObj,
					childLength = parentNode[childKey].length;

				//repair nodes old parent
				if (!setting.data.keep.parent && childLength == 0) {
					//old parentNode has no child nodes
					parentNode.isParent = false;
					parentNode.open = false;
					tmp_ulObj = $$(parentNode, consts.id.UL, setting);
					tmp_switchObj = $$(parentNode, consts.id.SWITCH, setting);
					tmp_icoObj = $$(parentNode, consts.id.ICON, setting);
					view.replaceSwitchClass(parentNode, tmp_switchObj, consts.folder.DOCU);
					view.replaceIcoClass(parentNode, tmp_icoObj, consts.folder.DOCU);
					tmp_ulObj.css("display", "none");

				} else if (setting.view.showLine && childLength > 0) {
					//old parentNode has child nodes
					var newLast = parentNode[childKey][childLength - 1];
					tmp_ulObj = $$(newLast, consts.id.UL, setting);
					tmp_switchObj = $$(newLast, consts.id.SWITCH, setting);
					tmp_icoObj = $$(newLast, consts.id.ICON, setting);
					if (parentNode == root) {
						if (parentNode[childKey].length == 1) {
							//node was root, and ztree has only one root after move node
							view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.ROOT);
						} else {
							var tmp_first_switchObj = $$(parentNode[childKey][0], consts.id.SWITCH, setting);
							view.replaceSwitchClass(parentNode[childKey][0], tmp_first_switchObj, consts.line.ROOTS);
							view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.BOTTOM);
						}
					} else {
						view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.BOTTOM);
					}
					tmp_ulObj.removeClass(consts.line.LINE);
				}
			},

			/**
			 * replace the ico class
			 * @param node
			 * @param obj
			 * @param newName
			 */
			replaceIcoClass: function (node, obj, newName) {
				if (!obj || node.isAjaxing) return;
				var tmpName = obj.attr("class");
				if (tmpName == undefined) return;
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
			 * @param node
			 * @param obj
			 * @param newName
			 */
			replaceSwitchClass: function (node, obj, newName) {
				if (!obj) return;
				var tmpName = obj.attr("class");
				if (tmpName == undefined) return;
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
				var aObj = $$(treeNode, consts.id.A, setting),
					fontCss = view.makeNodeFontCss(setting, treeNode);
				if (fontCss) {
					aObj.css(fontCss);
				}
			},

			/**
			 * apply the icon for the line element
			 * @param setting
			 * @param node
			 */
			setNodeLineIcos: function (setting, node) {
				if (!node) return;
				var switchObj = $$(node, consts.id.SWITCH, setting),
					ulObj = $$(node, consts.id.UL, setting),
					icoObj = $$(node, consts.id.ICON, setting),
					ulLine = view.makeUlLineClass(setting, node);
				if (ulLine.length == 0) {
					ulObj.removeClass(consts.line.LINE);
				} else {
					ulObj.addClass(ulLine);
				}
				switchObj.attr("class", view.makeNodeLineClass(setting, node));
				if (node.isParent) {
					switchObj.removeAttr("disabled");
				} else {
					switchObj.attr("disabled", "disabled");
				}
				icoObj.removeAttr("style");
				icoObj.attr("style", view.makeNodeIcoStyle(setting, node));
				icoObj.attr("class", view.makeNodeIcoClass(setting, node));
			},

			/**
			 * apply the node name to its html
			 * @param setting
			 * @param node
			 */
			setNodeName: function (setting, node) {
				var title = data.getNodeTitle(setting, node),
					nObj = $$(node, consts.id.SPAN, setting);
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
				var aObj = $$(node, consts.id.A, setting),
					url = view.makeNodeUrl(setting, node);
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
						return;
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
		 * @param obj
		 * @param zSetting
		 * @param zNodes
		 * @returns {*}
		 */
		init: function (obj, zSetting, zNodes) {
			var setting = tools.clone(_setting);
			$.extend(true, setting, zSetting);
			setting.treeId = obj.attr("id");
			setting.treeObj = obj;
			setting.treeObj.empty();
			settings[setting.treeId] = setting;
			//For some older browser,(e.g., ie6)
			if (typeof document.body.style.maxHeight === "undefined") {
				setting.view.expandSpeed = "";
			}
			data.initRoot(setting);
			var root = data.getRoot(setting),
				childKey = setting.data.key.children;
			zNodes = zNodes ? tools.clone(tools.isArray(zNodes) ? zNodes : [zNodes]) : [];
			if (setting.data.simpleData.enable) {
				root[childKey] = data.transformTozTreeFormat(setting, zNodes);
			} else {
				root[childKey] = zNodes;
			}

			data.initCache(setting);
			event.unbindTree(setting);
			event.bindTree(setting);
			event.unbindEvent(setting);
			event.bindEvent(setting);

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
					view.expandCollapseSonNode(setting, null, expandFlag, true);
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

					if (callbackFlag && expandFlag && (tools.apply(setting.callback.beforeExpand, [setting.treeId, node], true) == false)) {
						return null;
					} else if (callbackFlag && !expandFlag && (tools.apply(setting.callback.beforeCollapse, [setting.treeId, node], true) == false)) {
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
						view.expandCollapseSonNode(setting, node, expandFlag, true, showNodeFocus);
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
					return data.getNodeByParam(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), key, value);
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
					return data.getNodesByParam(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), key, value);
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
					return data.getNodesByParamFuzzy(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), key, value);
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
					if (!filter || (typeof filter != "function")) return (isSingle ? null : []);
					return data.getNodesByFilter(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), filter, isSingle, invokeParam);
				},

				/**
				 *
				 * @param node
				 * @returns {*}
				 */
				getNodeIndex: function (node) {
					if (!node) return null;
					var childKey = setting.data.key.children,
						parentNode = (node.parentTId) ? node.getParentNode() : data.getRoot(setting);
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
					var r = [], list = data.getRoot(setting).curSelectedList;
					for (var i = 0, l = list.length; i < l; i++) {
						r.push(list[i]);
					}
					return r;
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
				 If you have no special need, try not to use this method. If you refresh single node, please use updateNode() method. If you refresh child nodes in dynamic mode, please use the reAsyncChildNodes() method.
				 */
				refresh: function () {
					this.setting.treeObj.empty();
					var root = data.getRoot(setting),
						nodes = root[setting.data.key.children]
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
					var childKey = setting.data.key.children,
						nodes = node[childKey];
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
							} catch (e) {
							}
						}
						view.selectNode(setting, node, addFlag);
					}

					function showNodeFocus() {
						if (isSilent) {
							return;
						}
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
						view.setNodeLineIcos(setting, node);
						view.setNodeFontCss(setting, node);
					}
				}
			}
			root.treeTools = zTreeTools;
			data.setZTreeTools(setting, zTreeTools);

			if (root[childKey] && root[childKey].length > 0) {
				view.createNodes(setting, 0, root[childKey], null, -1);
			} else if (setting.async.enable && setting.async.url && setting.async.url !== '') {
				view.asyncNode(setting);
			}
			return zTreeTools;
		}
	};

	var zt = $.fn.zTree,
		$$ = tools.$,
		consts = zt.consts;
})(jQuery);
