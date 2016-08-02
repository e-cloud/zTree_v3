/*
 * JQuery zTree exHideNodes v3.5.24
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
	//default init node of exLib
	var _initNode = function (setting, level, node, parentNode, isFirstNode, isLastNode, openFlag) {
		if (typeof node.isHidden == "string") {
			node.isHidden = tools.eqs(node.isHidden, "true");
		}

		node.isHidden = !!node.isHidden;
		data.initHideForExCheck(setting, node);
	};
	var _zTreeTools = function (setting, zTreeTools) {
		zTreeTools.showNodes = function (nodes, options) {
			view.showNodes(setting, nodes, options);
		}

		zTreeTools.showNode = function (node, options) {
			if (!node) {
				return;
			}
			view.showNodes(setting, [node], options);
		}

		zTreeTools.hideNodes = function (nodes, options) {
			view.hideNodes(setting, nodes, options);
		}

		zTreeTools.hideNode = function (node, options) {
			if (!node) {
				return;
			}

			view.hideNodes(setting, [node], options);
		}

		var _checkNode = zTreeTools.checkNode;
		if (_checkNode) {
			zTreeTools.checkNode = function (node, checked, checkTypeFlag, callbackFlag) {
				if (!!node && !!node.isHidden) {
					return;
				}

				_checkNode.apply(zTreeTools, arguments);
			}
		}
	};
	var _data = {
		initHideForExCheck: function (setting, node) {
			if (node.isHidden && setting.check && setting.check.enable) {
				if (typeof node._nocheck == "undefined") {
					node._nocheck = !!node.nocheck
					node.nocheck = true;
				}

				node.check_Child_State = -1;

				if (view.repairParentChkClassWithSelf) {
					view.repairParentChkClassWithSelf(setting, node);
				}
			}
		},

		initShowForExCheck: function (setting, node) {
			if (!node.isHidden && setting.check && setting.check.enable) {
				if (typeof node._nocheck != "undefined") {
					node.nocheck = node._nocheck;
					delete node._nocheck;
				}

				if (view.setChkClass) {
					var checkObj = $$(node, consts.id.CHECK, setting);
					view.setChkClass(setting, checkObj, node);
				}

				if (view.repairParentChkClassWithSelf) {
					view.repairParentChkClassWithSelf(setting, node);
				}
			}
		}
	};
	var _view = {
		/**
		 * for finding out the old first node and reset its info to normal node
		 * @param setting
		 * @param node
		 */
		clearOldFirstNode: function (setting, node) {
			var nextNode = node.getNextNode();
			while (!!nextNode) {
				if (nextNode.isFirstNode) {
					nextNode.isFirstNode = false;
					view.setNodeLineIcons(setting, nextNode);
					break;
				}

				if (nextNode.isLastNode) {
					break;
				}

				nextNode = nextNode.getNextNode();
			}
		},

		/**
		 * for finding out the old last node and reset its info to normal node
		 * @param setting
		 * @param node
		 * @param openFlag
		 */
		clearOldLastNode: function (setting, node, openFlag) {
			var lastNode = node.getPreNode();
			while (!!lastNode) {
				if (lastNode.isLastNode) {
					lastNode.isLastNode = false;

					if (openFlag) {
						view.setNodeLineIcons(setting, lastNode);
					}
					break;
				}

				if (lastNode.isFirstNode) {
					break;
				}

				lastNode = lastNode.getPreNode();
			}
		},

		/**
		 * overwrite the same method in core, add some dom attribute to support
		 * hide feature
		 * @param html
		 * @param setting
		 * @param node
		 */
		makeDOMNodeMainBefore: function (html, setting, node) {
			html.push("<li ", (node.isHidden ? "style='display:none;' " : ""), "id='", node.tId, "' class='", consts.className.LEVEL, node.level, "' tabindex='0' hidefocus='true' treenode>");
		},

		showNode: function (setting, node, options) {
			node.isHidden = false;
			data.initShowForExCheck(setting, node);
			$$(node, setting).show();
		},

		showNodes: function (setting, nodes, options) {
			if (!nodes || nodes.length == 0) {
				return;
			}

			var pList = {};

			for (var i = 0, len = nodes.length; i < len; i++) {
				var n = nodes[i];

				if (!pList[n.parentTId]) {
					var pn = n.getParentNode();
					pList[n.parentTId] = (pn === null) ? data.getRoot(setting) : n.getParentNode();
				}

				view.showNode(setting, n, options);
			}

			for (var tId in pList) {
				var children = pList[tId][setting.data.key.children];
				view.setFirstNodeForShow(setting, children);
				view.setLastNodeForShow(setting, children);
			}
		},

		hideNode: function (setting, node, options) {
			node.isHidden = true;
			node.isFirstNode = false;
			node.isLastNode = false;
			data.initHideForExCheck(setting, node);
			view.cancelPreSelectedNode(setting, node);
			$$(node, setting).hide();
		},

		hideNodes: function (setting, nodes, options) {
			if (!nodes || nodes.length == 0) {
				return;
			}

			var pList = {};

			for (var i = 0, len = nodes.length; i < len; i++) {
				var node = nodes[i];

				if ((node.isFirstNode || node.isLastNode) && !pList[node.parentTId]) {
					var pn = node.getParentNode();
					pList[node.parentTId] = (pn === null) ? data.getRoot(setting) : node.getParentNode();
				}

				view.hideNode(setting, node, options);
			}

			for (var tId in pList) {
				var children = pList[tId][setting.data.key.children];
				view.setFirstNodeForHide(setting, children);
				view.setLastNodeForHide(setting, children);
			}
		},

		/**
		 * overwrite the same method in core
		 * @param setting
		 * @param parentNode
		 */
		setFirstNode: function (setting, parentNode) {
			var childKey = setting.data.key.children;
			var childLength = parentNode[childKey].length;

			if (childLength > 0) {
				if (parentNode[childKey][0].isHidden) {
					view.setFirstNodeForHide(setting, parentNode[childKey]);
				} else {
					parentNode[childKey][0].isFirstNode = true;
				}
			}
		},

		/**
		 * overwrite the same method in core
		 * @param setting
		 * @param parentNode
		 */
		setLastNode: function (setting, parentNode) {
			var childKey = setting.data.key.children;
			var childLength = parentNode[childKey].length;

			if (childLength > 0) {
				if (parentNode[childKey][0].isHidden) {
					view.setLastNodeForHide(setting, parentNode[childKey]);
				} else {
					parentNode[childKey][childLength - 1].isLastNode = true;
				}
			}
		},

		/**
		 * as setFirstNode is overwritten above, only the first visible node is
		 * the first node.
		 *
		 * this method try to find the first visible node and set it as first
		 * node and update its style
		 *
		 * @param setting
		 * @param nodes
		 * @returns {*}
		 */
		setFirstNodeForHide: function (setting, nodes) {
			var node;
			for (var i = 0, len = nodes.length; i < len; i++) {
				node = nodes[i];

				if (node.isFirstNode) {
					break;
				}

				if (!node.isHidden && !node.isFirstNode) {
					node.isFirstNode = true;
					view.setNodeLineIcons(setting, node);
					break;
				} else {
					node = null;
				}
			}
			return node;
		},

		/**
		 * restore the first hidden node style and remove first visible node
		 * style
		 * @param setting
		 * @param nodes
		 * @returns {{new: *, old: *}}
		 */
		setFirstNodeForShow: function (setting, nodes) {
			var node, first, old;
			for (var i = 0, len = nodes.length; i < len; i++) {
				node = nodes[i];

				if (!first && !node.isHidden) {
					if (node.isFirstNode) {
						first = node;
						break;
					} else {
						node.isFirstNode = true;
						first = node;
						view.setNodeLineIcons(setting, node);
					}
				} else if (first && node.isFirstNode) {
					node.isFirstNode = false;
					old = node;
					view.setNodeLineIcons(setting, node);
					break;
				} else {
					node = null;
				}
			}
			return { "new": first, "old": old };
		},

		/**
		 * as setLastNode is overwritten above, only the last visible node is
		 * the last node.
		 *
		 * this method try to find the last visible node and set it as last
		 * node and update its style
		 *
		 * @param setting
		 * @param nodes
		 * @returns {*}
		 */
		setLastNodeForHide: function (setting, nodes) {
			var node, i;
			for (i = nodes.length - 1; i >= 0; i--) {
				node = nodes[i];

				if (node.isLastNode) {
					break;
				}

				if (!node.isHidden && !node.isLastNode) {
					node.isLastNode = true;
					view.setNodeLineIcons(setting, node);
					break;
				} else {
					node = null;
				}
			}
			return node;
		},

		/**
		 * restore the last hidden node style and remove last visible node style
		 * @param setting
		 * @param nodes
		 * @returns {{new: *, old: *}}
		 */
		setLastNodeForShow: function (setting, nodes) {
			var node, last, old;

			for (var i = nodes.length - 1; i >= 0; i--) {
				node = nodes[i];

				if (!last && !node.isHidden) {
					if (node.isLastNode) {
						last = node;
						break;
					} else {
						node.isLastNode = false;
						old = node;
						view.setNodeLineIcons(setting, node);
					}
				} else if (last && node.isLastNode) {
					node.isLastNode = false;
					old = node;
					view.setNodeLineIcons(setting, node);
					break;
				} else {
					node = null;
				}
			}

			return { "new": last, "old": old };
		}
	};
	var _z = {
		view: _view,
		data: _data
	};

	$.extend(true, $.fn.zTree._z, _z);

	var zt = $.fn.zTree;
	var tools = zt._z.tools;
	var consts = zt.consts;
	var view = zt._z.view;
	var data = zt._z.data;
	var event = zt._z.event;
	var $$ = tools.$;

	data.addInitNode(_initNode);
	data.addZTreeTools(_zTreeTools);

	/*
	 * Override method in core
	 */
	var _dInitNode = data.initNode;
	/**
	 * wrap the origin initNode, that make TreeNode support target style on
	 * first/last visible node
	 *
	 * @param setting
	 * @param level
	 * @param node
	 * @param parentNode
	 * @param isFirstNode
	 * @param isLastNode
	 * @param openFlag
	 */
	data.initNode = function (setting, level, node, parentNode, isFirstNode, isLastNode, openFlag) {
		var tmpPNode = (parentNode) ? parentNode : data.getRoot(setting);
		var children = tmpPNode[setting.data.key.children];

		var tmpHideFirstNode = view.setFirstNodeForHide(setting, children);
		var tmpHideLastNode = view.setLastNodeForHide(setting, children);

		// partly, it's duplicated as setXXXNodeForHide will call the follow
		// inside
		if (openFlag) {
			view.setNodeLineIcons(setting, tmpHideFirstNode);
			view.setNodeLineIcons(setting, tmpHideLastNode);
		}

		isFirstNode = (tmpHideFirstNode === node);
		isLastNode = (tmpHideLastNode === node);

		if (_dInitNode) {
			_dInitNode.apply(data, arguments);
		}

		if (openFlag && isLastNode) {
			view.clearOldLastNode(setting, node, openFlag);
		}
	};

	/*
	 * the following overrides are similarly
	 * to ignore target operation when the node is hidden
	 */

	var _makeChkFlag = data.makeChkFlag;
	if (!!_makeChkFlag) {
		data.makeChkFlag = function (setting, node) {
			if (!!node && !!node.isHidden) {
				return;
			}

			_makeChkFlag.apply(data, arguments);
		}
	}

	var _getTreeCheckedNodes = data.getTreeCheckedNodes;
	if (!!_getTreeCheckedNodes) {
		data.getTreeCheckedNodes = function (setting, nodes, checked, results) {
			if (!!nodes && nodes.length > 0) {
				var p = nodes[0].getParentNode();
				if (!!p && !!p.isHidden) {
					return [];
				}
			}

			return _getTreeCheckedNodes.apply(data, arguments);
		}
	}

	var _getTreeChangeCheckedNodes = data.getTreeChangeCheckedNodes;
	if (!!_getTreeChangeCheckedNodes) {
		data.getTreeChangeCheckedNodes = function (setting, nodes, results) {
			if (!!nodes && nodes.length > 0) {
				var p = nodes[0].getParentNode();
				if (!!p && !!p.isHidden) {
					return [];
				}
			}

			return _getTreeChangeCheckedNodes.apply(data, arguments);
		}
	}

	var _expandCollapseSonNode = view.expandCollapseChildNodes;
	if (!!_expandCollapseSonNode) {
		view.expandCollapseChildNodes = function (setting, node, expandFlag, animateFlag, callback) {
			if (!!node && !!node.isHidden) {
				return;
			}

			_expandCollapseSonNode.apply(view, arguments);
		}
	}

	var _setSonNodeCheckBox = view.setSonNodeCheckBox;
	if (!!_setSonNodeCheckBox) {
		view.setSonNodeCheckBox = function (setting, node, value, srcNode) {
			if (!!node && !!node.isHidden) {
				return;
			}

			_setSonNodeCheckBox.apply(view, arguments);
		}
	}

	var _repairParentChkClassWithSelf = view.repairParentChkClassWithSelf;
	if (!!_repairParentChkClassWithSelf) {
		view.repairParentChkClassWithSelf = function (setting, node) {
			if (!!node && !!node.isHidden) {
				return;
			}

			_repairParentChkClassWithSelf.apply(view, arguments);
		}
	}
})(jQuery);
