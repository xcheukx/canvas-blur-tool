# canvas-blur-tool

模糊画笔工具，仅针对处理模糊图片所用。

由于项目上要用到，然后网上没找到相关的代码，于是自己撸了一个简易版的。原理就是  创建2个canvas（a跟b），a导入原图用作基础画板，b则用于将原图高斯模糊，在a中将b设置为笔刷图案 `context.strokeStyle = context.createPattern(b , 'repeat');`，即可实现模糊画笔的基础效果。

其中用到了高斯模糊算法，感谢作者。[但由于是通过搜索找到的，未找到原作者是谁]


## 安装

```javascript
<script src="/dist/BlurTool.min.js"></script>
```

```javascript
// CommonJS
const BlurTool = require('BlurTool');

// or ES6
import BlurTool from 'BlurTool'
```



## 使用方法

### 初始化 BlurTool ({target:'#id'})
必须设置target值。

| 参数 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| target | <code>String</code> | *Null* | 需要模糊处理的图片 |
| brushSize | <code>Number</code> | *5* | 笔刷大小 |
| radius | <code>Number</code> | *10* | 模糊取值半径 |
| sigma | <code>Number</code> | *15* | 方差取值 |

```javascript
var blurtool = new BlurTool({target:'#demoImg',brushSize:5});
```

### `save ()`
获得画板的图片数据.

```javascript
var blurtool = new BlurTool({target:'#demoImg'});
var imgData = blurtool.save() // data:image/png;base64,...
```

### `clear ()`
清除画板，恢复原始图片.

```javascript
var blurtool = new BlurTool({target:'#demoImg'});
blurtool.clear()
```

### `setBrush (size)`
setBrush()方法会返回设置后笔刷尺寸，用于改变当前笔刷大小。

| 参数 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| size | <code>Number</code> | *Null* | 笔刷大小 |

```javascript
var blurtool = new BlurTool({target:'#demoImg',brushSize:20});
console.log(blurtool.setBrush(5)); // brushSize:25
console.log(blurtool.setBrush(-5)); // brushSize:15
```

