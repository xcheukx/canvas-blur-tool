/*
* @Author: 卓圳宝
* @Date:   2017-12-05 15:46:36
* @Last Modified by:   卓圳宝
* @Last Modified time: 2017-12-08 17:38:38
*/

;(function(global, document, $, undefined) {
	//开启严格模式，规范代码，提高浏览器运行效率
    "use strict";

    //定义一个类，通常首字母大写
    var BlurTool = function(opts) {
        var defaults = {
            target:null,    // 目标图片
            brushSize:5     // 笔刷尺寸
        };
        var configs = $.extend(defaults, opts);
        this.configs = configs;
        console.log(this.configs);
        this.init(configs || {});
    };
	
	//覆写原型链，给继承者提供方法
    BlurTool.prototype = {
        constructor: BlurTool,
        init: function(configs) {
            var orginImg = typeof configs.target === "string" && document.getElementById(configs.target);
            // var fixImg = new Image();

            if(!orginImg){
                console.error('目标图片不存在,请检查configs.target是否填写正确');
                return;
            }
            
            this.orginImgDisplay = orginImg.style.display;
            this.width = orginImg.width,
            this.height = orginImg.height;

            var canvas_ = this.canvas_ = document.createElement('canvas');    //基础画板
            // this.canvas_;

            canvas_.setAttribute("width",this.width);
            canvas_.setAttribute("height",this.height);

            var self = this;
            // console.info('画布基础设置完成，读取图片：',orginImg);
            orginImg.addEventListener('load' , this.draw(orginImg), false);

            // 重新赋值，避免图片加载过快导致不进入onload。
            orginImg.src = orginImg.src;

        },
        draw:function(orginImg){
            var canvas_ = this.canvas_;
            // orginImg.crossOrigin="anonymous";
            var tempCanvas = document.createElement('canvas'); //模糊画板（用作笔刷图案）

            var tempCtx = tempCanvas.getContext("2d"); 
            var context = canvas_.getContext("2d");


            tempCanvas.setAttribute("width",this.width);
            tempCanvas.setAttribute("height",this.height);
            tempCanvas.style.display = 'none';


        // orginImg.onload = function() {
            // console.info('图片存在,执行绘图');
            context.drawImage(orginImg, 0, 0, this.width, this.height);//将图片转入画板中

            var data = context.getImageData(0, 0, this.width, this.height); //获得图片数据
            var emptyData = tempCtx.createImageData(this.width, this.height);
            emptyData = this.gaussBlur(data); //高斯模糊处理
            tempCtx.putImageData(emptyData, 0, 0); //模糊图层放置

            var tmpImg = new Image();  
            tmpImg.src = tempCanvas.toDataURL("image/png");
            var self = this;
            //确保模糊画板生成的img有被读取，否则画笔会默认黑色。
            tmpImg.onload = function() {
                context.lineWidth = self.configs.brushSize;
                context.lineCap = "round";
                context.strokeStyle = context.createPattern(tmpImg , 'repeat');         
                
                
                orginImg.style.display = 'none';
                orginImg.after(canvas_);

                var array_paint = [];
                var current_y = 0;
                var current_x = 0;
                //判断鼠标是否按下
                var m_down = false;

                function paint() {
                    context.beginPath();
                    context.moveTo(array_paint[0][0],array_paint[0][1]);
                    if(array_paint.length == 1){
                        context.lineTo(array_paint[0][0] +1,array_paint[0][1] +1);
                    }
                    else
                    {
                        var i =1; 
                        for(i in array_paint) {
                            context.lineTo(array_paint[i][0],array_paint[i][1]);
                            context.moveTo(array_paint[i][0],array_paint[i][1]);
                        }

                    }
                    context.closePath();
                    context.stroke();
                }

                //按下鼠标
                canvas_.onmousedown = function(event) {
                    m_down = true;
                    current_x = event.offsetX;
                    current_y = event.offsetY;
                    array_paint.push([current_x,current_y]);
                    paint();
                }

                //鼠标松开,清空数据
                canvas_.onmouseup = function(event) {
                    m_down = false;
                    array_paint = [];
                }

                //鼠标按下后拖动
                canvas_.onmousemove = function(event) {
                    if(m_down) {
                        current_x = event.offsetX;
                        current_y = event.offsetY;
                        array_paint.push([current_x,current_y]);
                        paint();
                    }
                }

            }
        },
        setBrush:function(size){
            var context = this.canvas_.getContext("2d");
            context.lineWidth = context.lineWidth + size;
            return context.lineWidth;
        },
        save:function(){
            // var img = new Image();  
            // img.src = this.canvas_.toDataURL("image/png");
            return this.canvas_.toDataURL("image/png");
        },
        clear:function(){
            var orginImg = document.getElementById(this.configs.target);
            var context = this.canvas_.getContext("2d");

            context.drawImage(orginImg, 0, 0, this.width, this.height);//将图片转入画板中
            
        },
        reset:function(){
            /**
             * 未完成
             */
            var orginImg = document.getElementById(this.configs.target);
            // var fixImg = new Image();

            if(!orginImg){
                console.error('目标图片不存在,请检查configs.target是否填写正确');
                return;
            }
            // console.log('this.orginImgDisplay:',this.orginImgDisplay);
            orginImg.style.display = this.orginImgDisplay;

            orginImg.removeEventListener("load", this.draw(orginImg), false);

            this.canvas_.parentNode.removeChild(this.canvas_);
            delete this.canvas_;


            this.init(this.configs);
        },
        gaussBlur:function(imgData){
            var pixes = imgData.data;
            var width = imgData.width;
            var height = imgData.height;
            var gaussMatrix = [],
                gaussSum = 0,
                x, y,
                r, g, b, a,
                i, j, k, len;

            var radius = 100; //radius:模糊取值半径
            var sigma = 15;  //sigma:方差取值

            a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
            b = -1 / (2 * sigma * sigma);
            //生成高斯矩阵
            for (i = 0, x = -radius; x <= radius; x++, i++){
                g = a * Math.exp(b * x * x);
                gaussMatrix[i] = g;
                gaussSum += g;

            }
            //归一化, 保证高斯矩阵的值在[0,1]之间
            for (i = 0, len = gaussMatrix.length; i < len; i++) {
                gaussMatrix[i] /= gaussSum;
            }
            //x 方向一维高斯运算
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    r = g = b = a = 0;
                    gaussSum = 0;
                    for(j = -radius; j <= radius; j++){
                        k = x + j;
                        if(k >= 0 && k < width){//确保 k 没超出 x 的范围
                            //r,g,b,a 四个一组
                            i = (y * width + k) * 4;
                            r += pixes[i] * gaussMatrix[j + radius];
                            g += pixes[i + 1] * gaussMatrix[j + radius];
                            b += pixes[i + 2] * gaussMatrix[j + radius];
                            // a += pixes[i + 3] * gaussMatrix[j];
                            gaussSum += gaussMatrix[j + radius];
                        }
                    }
                    i = (y * width + x) * 4;
                    // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
                    // console.log(gaussSum)
                    pixes[i] = r / gaussSum;
                    pixes[i + 1] = g / gaussSum;
                    pixes[i + 2] = b / gaussSum;
                    // pixes[i + 3] = a ;
                }
            }
            //y 方向一维高斯运算
            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    r = g = b = a = 0;
                    gaussSum = 0;
                    for(j = -radius; j <= radius; j++){
                        k = y + j;
                        if(k >= 0 && k < height){//确保 k 没超出 y 的范围
                            i = (k * width + x) * 4;
                            r += pixes[i] * gaussMatrix[j + radius];
                            g += pixes[i + 1] * gaussMatrix[j + radius];
                            b += pixes[i + 2] * gaussMatrix[j + radius];
                            // a += pixes[i + 3] * gaussMatrix[j];
                            gaussSum += gaussMatrix[j + radius];
                        }
                    }
                    i = (y * width + x) * 4;
                    pixes[i] = r / gaussSum;
                    pixes[i + 1] = g / gaussSum;
                    pixes[i + 2] = b / gaussSum;
                }
            }
            return imgData;
        }
    };

	//兼容CommonJs规范
    if (typeof module !== 'undefined' && module.exports) module.exports = BlurTool;

    //兼容AMD/CMD规范
    if (typeof define === 'function') define(function() { return BlurTool; });

    //注册全局变量，兼容直接使用script标签引入该插件
    global.BlurTool = BlurTool;

//this，在浏览器环境指window，在nodejs环境指global
//使用this而不直接用window/global是为了兼容浏览器端和服务端
//将this传进函数体，使全局变量变为局部变量，可缩短函数访问全局变量的时间
})(window, document, jQuery);