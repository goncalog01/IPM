class Node {
    constructor() {
        this.children = {};
        this.value = null;
    }
}

class Trie {
  /*
    constructor() {
        this.head = new Node();
    }

    insert(key, value) {
        let splitString = key.split("");
        let node = this.head;
        splitString.forEach(char => {
            if (node.children[char] == undefined)
                node.children[char] = new Node();
            node = node.children[char];
        })
        node.value = value;
    }

    _getNode(key) {
        let node = this.head;
        let splitString = key.split("");
        splitString.forEach(char => {
            if (node.children[char] != undefined)
                node = node.children[char];
        })
        return node;
    }
    _collect(x, prefix, results) {
        if (x == null)
            return;

        if (x.value != null) {
            let prefix_str = prefix.join("");
            results.push(prefix_str);
        }

        for (let c in x.children) {
            prefix.push(c);
            this._collect(x.children[c], prefix, results);
            prefix.pop();
        }
    }

    keysWithPrefix(prefix) {
        let results = [];

        let x = this._getNode(prefix);
        this._collect(x, prefix.split(""), results);
        return results;
    } */
  constructor() {
    this.array = [];
  }
  
  insert(key, value) {
        this.array.push(key)
    }
  
  keysWithPrefix(prefix) {
    let ret = [];
    for(let i = 0; i < this.array.length; i++) {
      if(ret.length > 2) return ret;
      if(this.array[i].substring(0,prefix.length) == prefix)
          ret.push(this.array[i]);
    }
    return ret;
  }

}

var searchTree = new Trie();