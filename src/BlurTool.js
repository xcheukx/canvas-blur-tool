/*
* @Author: xcheukx
* @Date:   2017-12-05 15:46:36
* @Last Modified by:   xcheukx
* @Last Modified time: 2017-12-11 09:58:53
*/
class BlurTool {
    constructor (opts) {
        if (typeof opts !== 'object') {
            throw new Error('Input must be a Object')
        }
        let defaultConfig = {
            target:null,
            brushSize:5,
            radius:10,
            sigma:15
        }
        // let config = defaultConfig
        this._config = {...defaultConfig,...opts}
        // this._isInit = false;
        this.init();
    }
    init(){
        const configs = this._config;
        const target = typeof configs.target === "string" && document.querySelector(configs.target);

        if(!target){
            console.error('目标图片不存在,请检查configs.target是否填写正确');
            return;
        }
        // this._isInit     = true;
        this._target     = target;
        this._imgDisplay = target.style.display;             // 记录img原display值
        this._width      = target.width;                     // 
        this._height     = target.height;                    // 

        this._canvas     = document.createElement('canvas');   //画板
        this._canvasCtx  = this._canvas.getContext("2d");
        this._canvas.setAttribute("width",this._width);
        this._canvas.setAttribute("height",this._height);
        this._arrPaint = [];

        
        target.addEventListener('load' , this.draw(), false);

        // 重新赋值，确保onload方法有执行。
        target.src = target.src;
    }
    draw(){
        const canvas     = this._canvas;                     // 画板
        const context    = this._canvasCtx;
        const tempCanvas = document.createElement('canvas'); //缓存画板（生成模糊图案用作笔刷）
        const tempCtx    = tempCanvas.getContext("2d");
        const positions  = [[0, 0],[this._width, this._height]];

        tempCanvas.setAttribute("width", this._width);
        tempCanvas.setAttribute("height",this._height);
        tempCanvas.style.display = 'none';

        context.drawImage(this._target, ...positions[0], ...positions[1]);      //图片绘制到画板中
        const data   = context.getImageData( ...positions[0], ...positions[1]); //获得画板的数据
        let blurData = tempCtx.createImageData(...positions[1]);                //创建空的图片数据
            blurData = this.gaussBlur(data);                                    //将画板数据进行高斯模糊处理
        tempCtx.putImageData(blurData, ...positions[0]);                        //将处理后的数据绘制至缓存画板中

        const tmpImg = new Image();  
        tmpImg.src = tempCanvas.toDataURL("image/png");

        //确保模糊画板生成的img有被读取，否则画笔会默认黑色。
        tmpImg.onload = () => {
            context.lineWidth = this._config.brushSize;
            context.lineCap = "round";
            context.strokeStyle = context.createPattern(tmpImg , 'repeat');         
            
            
            this._target.style.display = 'none';
            this._target.after(canvas);

            this.mouseEvent();
        }

    }
    canvasPaint(){
        const array_paint = this._arrPaint;
        const context = this._canvasCtx;
        if(!context) return;

        context.beginPath();
        context.moveTo(array_paint[0][0],array_paint[0][1]);
        if(array_paint.length == 1){
            context.lineTo(array_paint[0][0] + 1, array_paint[0][1] + 1);
        }
        else
        {
            let i = 1; 
            for(i in array_paint) {
                context.lineTo(array_paint[i][0], array_paint[i][1]);
                context.moveTo(array_paint[i][0], array_paint[i][1]);
            }

        }
        context.closePath();
        context.stroke();
    }
    mouseEvent(){
        let current_y = 0;
        let current_x = 0;
        //判断鼠标是否按下
        let m_down = false;

        //按下鼠标
        this._canvas.onmousedown = (event) => {
            m_down = true;
            current_x = event.offsetX;
            current_y = event.offsetY;
            this._arrPaint.push([current_x,current_y]);
            this.canvasPaint();
        }

        //鼠标松开,清空数据
        this._canvas.onmouseup = (event) => {
            m_down = false;
            this._arrPaint = [];
        }

        //鼠标按下后拖动
        this._canvas.onmousemove = (event) => {
            if(m_down) {
                current_x = event.offsetX;
                current_y = event.offsetY;
                this._arrPaint.push([current_x,current_y]);
                this.canvasPaint();
            }
        }
    }
    save(){
        if(!this._canvas){
            throw new Error('could not find the canvas!');
        }
        return this._canvas.toDataURL("image/png");
    }
    clear(){
        if(!this._target){
            throw new Error('could not find the target-image');
        }
        if(!this._canvasCtx){
            throw new Error('could not find the canvas!');
        }

        this._canvasCtx.drawImage(this._target, 0, 0, this._width, this._height);//将图片转入画板中
        
    }
    gaussBlur(imgData){
        const pixes = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        let gaussMatrix = [],
            gaussSum = 0,
            x, y,
            r, g, b, a,
            i, j, k, len;

        const radius = this._config.radius; //radius:模糊取值半径
        const sigma = 15;  //sigma:方差取值

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
            gaussMatrix[i] /= gaussSum; //gaussMatrix[i] = gaussMatrix[i] / gaussSum
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
}

export default BlurTool