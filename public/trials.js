// Base-64 encoded 
// Third-party matching
// DisableThirdPartyStoragePartitioning Deprecation Trial (Good until September 2024, v126)
const TOKEN = 'AxsDw7DRRGnUd/uCwS377hC/w8d+4Necn0LJNDbISunhVsLPD93lSjF2AB7GOatx1YD4DYRJl5+ZTSaeRwo+3wgAAACFeyJvcmlnaW4iOiJodHRwczovL3d3dy5zdG9pY3dhbGxldC5jb206NDQzIiwiZmVhdHVyZSI6IkRpc2FibGVUaGlyZFBhcnR5U3RvcmFnZVBhcnRpdGlvbmluZyIsImV4cGlyeSI6MTcyNTQwNzk5OSwiaXNUaGlyZFBhcnR5Ijp0cnVlfQ==';
const otMeta = document.createElement('meta');
otMeta.httpEquiv = 'origin-trial';
otMeta.content = TOKEN;
document.head.append(otMeta);
