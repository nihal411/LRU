

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Simple CDLL node & LRU implementation in JS (mirrors your Java approach)
class Node {
  constructor(k, v) {
    this.k = k;
    this.v = v;
    this.prev = null;
    this.next = null;
  }
}

class CDLL {
  constructor() {
    this.head = null;
  }

  insBegin(k, v) {
    const nn = new Node(k, v);
    if (!this.head) {
      nn.prev = nn.next = nn;
      this.head = nn;
      return nn;
    }
    const last = this.head.prev;
    nn.next = this.head;
    nn.prev = last;
    last.next = nn;
    this.head.prev = nn;
    this.head = nn;
    return nn;
  }

  moveAtFront(node) {
    if (!this.head || this.head === node) return;
    node.prev.next = node.next;
    node.next.prev = node.prev;
    const last = this.head.prev;
    node.next = this.head;
    node.prev = last;
    last.next = node;
    this.head.prev = node;
    this.head = node;
  }

  delEnd() {
    if (!this.head) return null;
    if (this.head.next === this.head) {
      const t = this.head;
      this.head = null;
      return t;
    }
    const last = this.head.prev;
    const secondLast = last.prev;
    secondLast.next = this.head;
    this.head.prev = secondLast;
    return last;
  }

  // helper to return array from most recent to least
  toArray() {
    const out = [];
    if (!this.head) return out;
    let cur = this.head;
    do {
      out.push({k: cur.k, v: cur.v});
      cur = cur.next;
    } while (cur !== this.head);
    return out;
  }
}

class LRUCache {
  constructor(capacity) {
    this.list = new CDLL();
    this.m = new Map();
    this.cap = capacity;
    this.size = 0;
  }

  get(key) {
    if (!this.m.has(key)) return -1;
    const node = this.m.get(key);
    this.list.moveAtFront(node);
    return node.v;
  }

  put(key, value) {
    if (this.m.has(key)) {
      const node = this.m.get(key);
      node.v = value;
      this.list.moveAtFront(node);
      return {evicted: null};
    }
    if (this.size === this.cap) {
      const lru = this.list.delEnd();
      if (lru) {
        this.m.delete(lru.k);
        this.size--;
        const node = this.list.insBegin(key, value);
        this.m.set(key, node);
        this.size++;
        return {evicted: {k: lru.k, v: lru.v}};
      }
    } else {
      const node = this.list.insBegin(key, value);
      this.m.set(key, node);
      this.size++;
      return {evicted: null};
    }
  }

  state() {
    return this.list.toArray();
  }
}

// Create a single cache instance (you can change capacity via query param)
let cache = new LRUCache(3);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: get
app.get('/api/get', (req, res) => {
  const key = parseInt(req.query.key);
  if (Number.isNaN(key)) return res.status(400).json({error: 'invalid key'});
  const val = cache.get(key);
  res.json({key, value: val, state: cache.state()});
});

// API: put
app.post('/api/put', (req, res) => {
  const {key, value} = req.body;
  const k = parseInt(key);
  if (Number.isNaN(k)) return res.status(400).json({error: 'invalid key'});
  const result = cache.put(k, value);
  res.json({key: k, value, evicted: result.evicted, state: cache.state()});
});

// API: set capacity (recreates cache)
app.post('/api/setCapacity', (req, res) => {
  const {capacity} = req.body;
  const c = parseInt(capacity);
  if (!Number.isInteger(c) || c <= 0) return res.status(400).json({error: 'invalid capacity'});
  cache = new LRUCache(c);
  res.json({capacity: c, state: cache.state()});
});

// API: state
app.get('/api/state', (req, res) => {
  res.json({state: cache.state(), capacity: cache.cap});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LRU web app listening on ${PORT}`));
