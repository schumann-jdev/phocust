import { Component, ElementRef, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { MainService } from '../services/main.service';
import { EChartsOption } from 'echarts';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { config } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;
  pathImage = "";
  imageWidth: number = 0;
  imageHeight: number = 0;
  original: any;
  opacity:number = 0;
  luminosite:number = 0;
  arrayStory: any = [];
  dataImageOrigin: any;
  storyIndice: number = 0;
  minimal = 0;
  maximal = 255;
  histogramme: any = {
    redHisto : [],
    greenHisto: [],
    blueHisto: []
  };
  nameFile: string = "MyImage";
  typeFile: string = "png";

  mergeOptions = {};

  chartOption: EChartsOption = {
    xAxis: {
      type: 'category',
      //data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type : 'value',

      show : false,

      splitLine: {

        show: false

      }
    },
    series: [
      {
        data: this.histogramme.redHisto,
        type: 'line',
        smooth: true,
        showSymbol: false,
        color: '#FF9F9F'

      },
      {
        data: this.histogramme.greenHisto,
        type: 'line',
        smooth: true,
        showSymbol: false,
        color: '#9FCF9F'
      },
      {
        data: this.histogramme.blueHisto,
        type: 'line',
        smooth: true,
        showSymbol: false,
        color: '#9F9FFF'
      }
    ],
  };

  constructor(private mainService: MainService,config: NgbModalConfig, private modalService: NgbModal) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
  }

  change(eventTarget: any) {
    let imgPath = URL.createObjectURL(eventTarget);
    this.pathImage = "initialized";
    this.draw(this.canvas, imgPath);
  }

  draw(canvas: ElementRef<HTMLCanvasElement>, path: string) {
    let img = new Image();
    let self: any = this;
    img.onload = function(){
      let imgHeight = window.innerHeight - 100;
      let imgWidth = ((window.innerHeight - 100) * img.width) / img.height;

      self.ctx = canvas.nativeElement.getContext('2d');
      canvas.nativeElement.height = imgHeight;
      canvas.nativeElement.width = imgWidth > 990 ? 990 : imgWidth;
      self.ctx.mozImageSmoothingEnabled = false;
      self.ctx.webkitImageSmoothingEnabled = false;
      self.ctx.msImageSmoothingEnabled = false;
      self.ctx.imageSmoothingEnabled = false;
      self.ctx.drawImage(img, 0, 0, canvas.nativeElement.width, canvas.nativeElement.height);
      self.dataImageOrigin = self.ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height);
      self.original = self.ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height);
      self.resetImage(self.dataImageOrigin, -1);
      self.setStory("Ouvrir image", self.dataImageOrigin);
      self.getHistogramme();

      self.imageWidth = img.width;
      self.imageHeight = img.height;
    }
    img.src = path;
  }

  putOriginal(): void {
    this.ctx.putImageData(this.dataImageOrigin, 0,0);
    this.getHistogramme();
  }

  resetImage(imageData: any, index: any): void {
    if(this.dataImageOrigin.width != imageData.width) {
      let img = new Image();
      let self: any = this;

      createImageBitmap(imageData).then(function(imgBitmap) {
        self.canvas.nativeElement.width = imageData.width;
        self.ctx.drawImage(imgBitmap, 0, 0, imageData.width, imageData.height);
        self.dataImageOrigin = imageData;
        self.getHistogramme()
        self.storyIndice =  index
      });

      // img.onload = function(){
      //   let imgHeight = self.canvas.nativeElement.height;
      //   self.canvas.nativeElement.width = imageData.width;
      //   self.ctx.putImageData(imageData, 0, 0);
      //   self.ctx.drawImage(img, 0, 0, self.canvas.nativeElement.width, self.canvas.nativeElement.height);
      // }
      // img.src = this.canvas.nativeElement.toDataURL("image/png");

      // setTimeout(function(){
      //   self.ctx.putImageData(imageData, 0, 0);
      //   self.dataImageOrigin = imageData;
      //   self.getHistogramme()
      //   self.storyIndice =  index
      // }, 5)

    } else {
      this.ctx.putImageData(imageData, 0, 0);
      this.dataImageOrigin = imageData;
      this.getHistogramme()
      this.storyIndice =  index
    }
  }

  drawMiniFiltre(canvasId: string): any{
    let miniCanvas: any = document.getElementById(canvasId);
    let ctxMiniCanvas: any = miniCanvas.getContext('2d');
    let imgMiniCanvas = new Image();
    let imgMainCanvasURL = this.canvas.nativeElement.toDataURL("image/png");


    imgMiniCanvas.onload = function() {
      let imgWidth: any = ((miniCanvas.height + 10)*imgMiniCanvas.width)/imgMiniCanvas.height;
      miniCanvas.width = imgWidth < 120 ? imgWidth : 120;

      ctxMiniCanvas.drawImage(imgMiniCanvas, 0, 0, miniCanvas.width, miniCanvas.height);
    }
    imgMiniCanvas.src = imgMainCanvasURL;

    return miniCanvas
  }

  onContour(): void {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue: number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }


    let redRes: any[] = this.paperTurtle(this.transformation2D(colorRed));
    let greenRes: any[] = this.paperTurtle(this.transformation2D(colorGreen));
    let blueRes: any[] = this.paperTurtle(this.transformation2D(colorBlue));
  }

  paperTurtle(matriceImage: any[][]): any {
    let turtleOrientation: string = "nord";
    //let matriceImage: any[][] = [[0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0]];
    let coordContourDepart: any = {x: 0, y: 0};
    let currentCoord: any = {x: 0, y: 0};
    let infoCurrentPosition: any = {};
    let contour: any[] = [];
    let continueToWalk: boolean = true;

    loop1:
      for(let i = 0; i < matriceImage.length; i++) {
      loop2 :
        for(let j = 0; j < matriceImage[i].length; j++) {
          if(matriceImage[i][j] == 255) {
            coordContourDepart.x = j;
            coordContourDepart.y = i;
            infoCurrentPosition = this.turtleGoLeft(turtleOrientation, coordContourDepart.x, coordContourDepart.y);
            currentCoord.x = infoCurrentPosition.x;
            currentCoord.y = infoCurrentPosition.y;
            turtleOrientation = infoCurrentPosition.headOrientation;
            contour.push({x: coordContourDepart.x, y: coordContourDepart.y});
            break loop2
          }
        }
        if(matriceImage[i][coordContourDepart.x] == 255) {
          break loop1;
        }
    }

    do {
      if(matriceImage[currentCoord.y][currentCoord.x] == 255) {
        if(contour[contour.length - 1].x != currentCoord.x && contour[contour.length - 1].y != currentCoord.y) {
          contour.push({x: currentCoord.x, y: currentCoord.y});
        } else if(contour[contour.length - 1].x != currentCoord.x && contour[contour.length - 1].y == currentCoord.y) {
          contour.push({x: currentCoord.x, y: currentCoord.y});
        } else if(contour[contour.length - 1].x == currentCoord.x && contour[contour.length - 1].y != currentCoord.y) {
          contour.push({x: currentCoord.x, y: currentCoord.y});
        }

        infoCurrentPosition = this.turtleGoLeft(turtleOrientation, currentCoord.x, currentCoord.y);
        currentCoord.x = infoCurrentPosition.x;
        currentCoord.y = infoCurrentPosition.y;
        turtleOrientation = infoCurrentPosition.headOrientation;

        if(coordContourDepart.x == currentCoord.x) {
          if(coordContourDepart.y == currentCoord.y) {
            continueToWalk = false;
          }
        }

      } else if(matriceImage[currentCoord.y][currentCoord.x] == 0) {
        infoCurrentPosition = this.turtleGoRight(turtleOrientation, currentCoord.x, currentCoord.y);
        currentCoord.x = infoCurrentPosition.x;
        currentCoord.y = infoCurrentPosition.y;
        turtleOrientation = infoCurrentPosition.headOrientation;

        if(coordContourDepart.x == currentCoord.x) {
          if(coordContourDepart.y == currentCoord.y) {
            continueToWalk = false;
          }
        }
      } else {
        infoCurrentPosition = this.turtleGoRight(turtleOrientation, currentCoord.x, currentCoord.y);
        currentCoord.x = infoCurrentPosition.x;
        currentCoord.y = infoCurrentPosition.y;
        turtleOrientation = infoCurrentPosition.headOrientation;

        if(coordContourDepart.x == currentCoord.x) {
          if(coordContourDepart.y == currentCoord.y) {
            continueToWalk = false;
          }
        }
      }
    } while (continueToWalk)
    console.log("contour ", contour);
    return contour;
  }

  turtleGoLeft(headOrientation: string, pX: number, pY: number): any {
    let newPosition: any = {x: 0, y: 0, headOrientation: ""}
    if(headOrientation == "nord") {
      newPosition.x = pX;
      newPosition.y = pY - 1;
      newPosition.headOrientation = "ouest"
    }
    if(headOrientation == "ouest") {
      newPosition.x = pX - 1;
      newPosition.y = pY;
      newPosition.headOrientation = "sud"
    }
    if(headOrientation == "sud") {
      newPosition.x = pX;
      newPosition.y = pY + 1;
      newPosition.headOrientation = "est";
    }
    if(headOrientation == "est") {
      newPosition.x = pX + 1;
      newPosition.y = pY;
      newPosition.headOrientation = "nord";
    }

    return newPosition;
  }

  turtleGoRight(headOrientation: string, pX: number, pY: number): any {
    let newPosition: any = {x: 0, y: 0, headOrientation: ""}
    if(headOrientation == "nord") {
      newPosition.x = pX;
      newPosition.y = pY + 1;
      newPosition.headOrientation = "est"
    }
    if(headOrientation == "ouest") {
      newPosition.x = pX + 1;
      newPosition.y = pY;
      newPosition.headOrientation = "nord"
    }
    if(headOrientation == "sud") {
      newPosition.x = pX;
      newPosition.y = pY - 1;
      newPosition.headOrientation = "ouest";
    }
    if(headOrientation == "est") {
      newPosition.x = pX - 1;
      newPosition.y = pY;
      newPosition.headOrientation = "sud";
    }

    return newPosition;
  }

  setStory(nameTache: any, imageData: any): void {
    if(this.storyIndice < this.arrayStory.length - 1) {
      this.arrayStory.length = this.storyIndice+1;
    }
    this.arrayStory.push({nameTache: nameTache, imageData: imageData});
    this.dataImageOrigin = imageData;
    this.storyIndice++;
  }

  open(content: any) {
    let self: any = this;

    let modalRef: any = this.modalService.open(content, {windowClass: 'background-transparent', backdropClass: 'transparent-backdrop', size: 'lg'}).result.then((result) => {
      if(result == "save") {
        let input:any = document.getElementsByName("miniCanvas");
        for(let i=0; i < input.length; i++) {
            if(input[i].checked) {
              if(input[i].value != "original") {
                let imageData: any = self.ctx.getImageData(0, 0, self.canvas.nativeElement.width, self.canvas.nativeElement.height);
                self.setStory("Filtrage : "+input[i].value, imageData);
              }
            }
        }
      } else {
        self.putOriginal()
      }
    }, (reason) => {

    });
    this.drawMiniFiltre('canvasDepart');
    let miniCanvasLiss: any = this.drawMiniFiltre('canvasLissage');
    let miniCanvasGauss: any = this.drawMiniFiltre('canvasGaussien');
    let miniCanvasConv: any = this.drawMiniFiltre('canvasConvolution');
    let miniCanvasReh: any = this.drawMiniFiltre('canvasRehausseur');
    let miniCanvasAcc: any = this.drawMiniFiltre('canvasAccentuation');
    let miniCanvasLap: any = this.drawMiniFiltre('canvasLaplacien');
    setTimeout(function(){
      self.onFiltrageLineaire("lissage", false, miniCanvasLiss, miniCanvasLiss.getContext('2d'));
      self.onFiltrageLineaire("gaussien", false, miniCanvasGauss, miniCanvasGauss.getContext('2d'));
      self.onFiltrageLineaire("convolution", false, miniCanvasConv, miniCanvasConv.getContext('2d'));
      self.onFiltrageLineaire("rehausseur", false, miniCanvasReh, miniCanvasReh.getContext('2d'));
      self.onFiltrageLineaire("accentuation", false, miniCanvasAcc, miniCanvasAcc.getContext('2d'));
      self.onFiltrageLineaire("laplacien", false, miniCanvasLap, miniCanvasLap.getContext('2d'));
    }, 70)
  }

  openLumiere(content: any) {
    let self: any = this;

    let modalRef: any = this.modalService.open(content, {windowClass: 'background-transparent', backdropClass: 'transparent-backdrop', size: 'sm'}).result.then((result) => {
      if(result == "save") {
        let imageData: any = self.ctx.getImageData(0, 0, self.canvas.nativeElement.width, self.canvas.nativeElement.height);
        self.setStory("Reglage lumière", imageData);
        this.opacity = 0;
        this.luminosite = 0;
      } else {
        self.putOriginal()
        this.opacity = 0;
        this.luminosite = 0;
      }
        console.log("close result", result);
    }, (reason) => {

    });
  }

  openEtalage(content: any) {
    let self: any = this;

    let modalRef: any = this.modalService.open(content, {windowClass: 'background-transparent', backdropClass: 'transparent-backdrop', size: 'sm'}).result.then((result) => {
      if(result == "save") {
        let imageData: any = self.ctx.getImageData(0, 0, self.canvas.nativeElement.width, self.canvas.nativeElement.height);
        self.setStory("Etalage Dynamique", imageData);
        this.minimal = 0;
        this.maximal = 255;
      } else {
        self.putOriginal();
        this.minimal = 0;
        this.maximal = 255;
      }
        console.log("close result", result);
    }, (reason) => {

    });
  }

  openSaveAs(content: any) {
    let self: any = this;

    let modalRef: any = this.modalService.open(content, {windowClass: 'background-transparent', backdropClass: 'transparent-backdrop'}).result.then((result) => {
      if(result == "save") {
        if(this.nameFile == "" || this.nameFile == null) {
          this.nameFile = "MyImage"
        }
        this.onSaveAs();
      } else {
        this.nameFile = "MyImage";
      }
        console.log("close result", result);
    }, (reason) => {

    });
  }

  openNonLineaire(content: any) {
    let self: any = this;

    let modalRef: any = this.modalService.open(content, {windowClass: 'background-transparent', backdropClass: 'transparent-backdrop', size: 'me'}).result.then((result) => {
      if(result == "save") {
        let input:any = document.getElementsByName("miniCanvasNon");
        for(let i=0; i < input.length; i++) {
            if(input[i].checked) {
              if(input[i].value != "original") {
                let imageData: any = self.ctx.getImageData(0, 0, self.canvas.nativeElement.width, self.canvas.nativeElement.height);
                self.setStory("Filtrage : "+input[i].value, imageData);
              }
            }
        }
      } else {
        self.putOriginal()
      }
        console.log("close result", result);
    }, (reason) => {

    });
    this.drawMiniFiltre('canvasDepart1');
    let miniCanvasErosion: any = this.drawMiniFiltre('canvasErosion');
    let miniCanvasDilatation: any = this.drawMiniFiltre('canvasDilatation');
    let miniCanvasMediane: any = this.drawMiniFiltre('canvasMediane');
    setTimeout(function(){
      self.onFiltrageNonlineaire("erosion", false, miniCanvasErosion, miniCanvasErosion.getContext('2d'));
      self.onFiltrageNonlineaire("dilatation", false, miniCanvasDilatation, miniCanvasDilatation.getContext('2d'));
      self.onMediane(false, miniCanvasMediane, miniCanvasMediane.getContext('2d'));
    }, 100)
  }

  getHistogramme(): void {
    let colorRed: number[] = [];
    let colorGreen: number[] = [];
    let colorBlue: number[] = [];
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRedRefactored: any = this.mainService.refactorColorData(colorRed);
    let colorGreenRefactored: any = this.mainService.refactorColorData(colorGreen);
    let colorBlueRefactored: any = this.mainService.refactorColorData(colorBlue);

    this.histogramme.redHisto = this.mainService.calculHisto(colorRedRefactored.histo);
    this.histogramme.greenHisto = this.mainService.calculHisto(colorGreenRefactored.histo);
    this.histogramme.blueHisto = this.mainService.calculHisto(colorBlueRefactored.histo);

    this.mergeOptions = {
      series: [
        {
          data: this.mainService.calculHisto(colorRedRefactored.histo),
          type: 'line',
          smooth: true,
          showSymbol: false,
          color: '#FF9F9F'

        },
        {
          data: this.mainService.calculHisto(colorGreenRefactored.histo),
          type: 'line',
          smooth: true,
          showSymbol: false,
          color: '#9FCF9F'
        },
        {
          data: this.mainService.calculHisto(colorBlueRefactored.histo),
          type: 'line',
          smooth: true,
          showSymbol: false,
          color: '#9F9FFF'
        }
      ]
    }
  }

  onBinarisation(isToStuckInStory: boolean, isMainCanvas: boolean = true, canvas: any = this.canvas, ctx: any = this.ctx): void {
    this.onGrayNiveau(false, isMainCanvas, canvas, ctx);
    let imageData: any;

    if(isToStuckInStory) {
      imageData = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
    } else {
      if(isMainCanvas) {
        imageData = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

        } else {
          imageData = ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        }
    }
    let colorRed: number[] = [];
    let colorGreen: number[] = [];
    let colorBlue: number[] = [];

    let data: any[] = imageData.data;



    for (let i = 0; i < data.length; i += 4) {
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRedRefactored: any = this.mainService.refactorColorData(colorRed);
    let colorGreenRefactored: any = this.mainService.refactorColorData(colorGreen);
    let colorBlueRefactored: any = this.mainService.refactorColorData(colorBlue);

    let histoRed: number[] = this.mainService.calculHisto(colorRedRefactored.histo);
    let histoGreen: number[] = this.mainService.calculHisto(colorGreenRefactored.histo);
    let histoBlue: number[] = this.mainService.calculHisto(colorBlueRefactored.histo);

    let redRefactored: any[] = this.mainService.makeColorArray(colorRedRefactored.histo);
    let greenRefactored: any[] = this.mainService.makeColorArray(colorGreenRefactored.histo);
    let blueRefactored: any[] = this.mainService.makeColorArray(colorBlueRefactored.histo);

    let redRes: any = this.mainService.binarisation(redRefactored, histoRed);
    let iter: number = 0
    colorRed.forEach((item, index) => {
      data[iter] = redRes[redRefactored.indexOf(item)];
      colorRed[index] = redRes[redRefactored.indexOf(item)];
      iter += 4;
    });

    let greenRes: any = this.mainService.binarisation(greenRefactored, histoGreen);
    let iter1: number = 0
    colorGreen.forEach((item, index) => {
      data[iter1 + 1] = greenRes[greenRefactored.indexOf(item)];
      iter1 += 4;
    });

    let blueRes: any = this.mainService.binarisation(blueRefactored, histoBlue);
    let iter2: number = 0
    colorBlue.forEach((item, index) => {
      data[iter2 + 2] = blueRes[blueRefactored.indexOf(item)];
      iter2 += 4;
    });

    if(isToStuckInStory) {
      ctx.putImageData(imageData, 0, 0);
      this.setStory("Binarisation", imageData);
      this.getHistogramme();
    } else {
      if(isMainCanvas) {
        ctx.putImageData(imageData, 0, 0);
      } else {
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }

  onChoose(): void {
    let input: any = document.createElement('input');
    input.type = 'file';
    input.click();

    let self: any = this;
    input.onchange = function(event: any) {
      self.change(event.target.files[0]);
      console.log("evenement", event.target.files);
    }
  }

  onGrayNiveau(isToStuckInSTory: boolean, isMainCanvas: boolean = true, canvas: any = this.canvas, ctx: any = this.ctx) {
    let imageData: any;

    if(isToStuckInSTory) {
      imageData = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
    } else {
      if(isMainCanvas) imageData = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        else imageData = ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }
    let data: any[] = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let moy = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i]     = moy;
      data[i + 1] = moy;
      data[i + 2] = moy;
    }

    if(isToStuckInSTory) {
      this.ctx.putImageData(imageData, 0, 0);
      this.setStory("Niveau de gris", imageData);
      this.getHistogramme();
    } else {
      if(isMainCanvas) {
        this.ctx.putImageData(imageData, 0, 0);
      } else {
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }

  onHistoNear(isToStuckInStory): void {
    let colorRed: number[] = [];
    let colorGreen: number[] = [];
    let colorBlue: number[] = [];
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRedRefactored: any = this.mainService.refactorColorData(colorRed);
    let colorGreenRefactored: any = this.mainService.refactorColorData(colorGreen);
    let colorBlueRefactored: any = this.mainService.refactorColorData(colorBlue);

    let histoRed: number[] = this.mainService.calculHisto(colorRedRefactored.histo);
    let histoGreen: number[] = this.mainService.calculHisto(colorGreenRefactored.histo);
    let histoBlue: number[] = this.mainService.calculHisto(colorBlueRefactored.histo);

    let redRefactored: any[] = this.mainService.makeColorArray(colorRedRefactored.histo);
    let greenRefactored: any[] = this.mainService.makeColorArray(colorGreenRefactored.histo);
    let blueRefactored: any[] = this.mainService.makeColorArray(colorBlueRefactored.histo);

    this.mainService.equalizeNearHisto(redRefactored, histoRed)
      .then(
        function(redRes: any) {
          let iter: number = 0
          colorRed.forEach((item, index) => {
            data[iter] = redRes[redRefactored.indexOf(item)];

            iter += 4;
          })
        }
    );

    this.mainService.equalizeNearHisto(greenRefactored, histoGreen)
    .then(
      function(greenRes: any) {
        let iter: number = 0
        colorGreen.forEach((item, index) => {
          data[iter + 1] = greenRes[greenRefactored.indexOf(item)];

          iter += 4;
        })
      }
    );

    let self: any = this;
    this.mainService.equalizeNearHisto(blueRefactored, histoBlue)
    .then(
      function(blueRes: any) {
        let iter: number = 0
        colorBlue.forEach((item, index) => {
          data[iter + 2] = blueRes[blueRefactored.indexOf(item)];

          iter += 4;
        });
        self.ctx.putImageData(imageData, 0, 0);
        if(isToStuckInStory) {
          self.setStory("Egalisation d'histogramme", imageData);
          self.getHistogramme();
        }
      }
    );
  }

  onInversion(isToStuckInStory): void {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    this.ctx.putImageData(imageData, 0, 0);
    if(isToStuckInStory) {
      this.setStory("Inversion de couleur", imageData);
      this.getHistogramme()
    }
  };

  originalImage(): any{
    this.ctx.putImageData(this.original, 0, 0);
  }

  veriferLuminositer(): void{
    this.putOriginal();
    const imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    const data: any[] = imageData.data;
    let luminosite: number;
    luminosite = this.luminosite;
    for (let i = 0; i < data.length; i += 4) {
      data[i] += luminosite;
      data[i + 1] += luminosite;
      data[i + 2] += luminosite;
      }
    this.ctx.putImageData(imageData, 0, 0);
  }
  verifierContrast(): void {
    this.putOriginal();
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let contrast: number;
    let inter = 0;

    contrast = this.opacity;
    contrast = (contrast / 100) + 1;
    inter = 128 * (1 - contrast);

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = data[i] * contrast + inter;
      data[i + 1] = data[i + 1] * contrast + inter;
      data[i + 2] = data[i + 2] * contrast + inter;
    }
    this.ctx.putImageData(imageData, 0, 0);
  }
  onLumunosite(): void{
    this.verifierContrast();
    const imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    const data: any[] = imageData.data;
    let luminosite: number;
    luminosite = this.luminosite;
    for (let i = 0; i < data.length; i += 4) {
      data[i] += luminosite;
      data[i + 1] += luminosite;
      data[i + 2] += luminosite;
      }
    this.ctx.putImageData(imageData, 0, 0);
    this.getHistogramme();
  }

  onOpacity(): void {
    this.veriferLuminositer();
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let contrast: number;
    let inter = 0;

    contrast = this.opacity;
    contrast = (contrast / 100) + 1;
    inter = 128 * (1 - contrast);

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = data[i] * contrast + inter;
      data[i + 1] = data[i + 1] * contrast + inter;
      data[i + 2] = data[i + 2] * contrast + inter;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.getHistogramme();
  }

  onSaveAs(nameFile: string = this.nameFile, typeFile: string = this.typeFile): void {
    let exportCanvas: any = document.createElement('canvas');
    exportCanvas.width = this.imageWidth;
    exportCanvas.height = this.imageHeight;
      let ctxExport: any = exportCanvas.getContext('2d');
      let self: any = this;
      createImageBitmap(this.dataImageOrigin).then(function(imgBitmap) {
        ctxExport.mozImageSmoothingEnabled = false;
        ctxExport.webkitImageSmoothingEnabled = false;
        ctxExport.msImageSmoothingEnabled = false;
        ctxExport.imageSmoothingEnabled = false;
        ctxExport.drawImage(imgBitmap, 0, 0, exportCanvas.width, exportCanvas.height);
      });

    setTimeout(function() {
      let imageURI: any;
      if(self.canvas.nativeElement.width == self.canvas.nativeElement.height) imageURI = self.canvas.nativeElement.toDataURL("image/"+typeFile, 0.92);
        else imageURI = exportCanvas.toDataURL("image/"+typeFile, 1.0);
      let a: any = document.createElement('a');
      a.href = imageURI;
      a.download = nameFile+"."+typeFile;
      a.click();
    }, 10)

  }

  transformation2D(couleur: any[]): any{
    let result: any[][] = [[]];
    let imageData = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let iteration: number = 0;
    for(let i=0; i < imageData.height; i++){
      let resTemp: any[] = [];
      for(let j=0; j < imageData.width; j++){
        resTemp.push(couleur[iteration]);
        iteration++;
      }
      result[i] = resTemp;
    }
    return result;
  }

  onFiltrageLineaire(nomMasque: string, isMainCanvas: boolean, canvas: any = this.canvas, ctx: any = this.ctx): void{
    let masque: any[][];
    switch (nomMasque) {
      case 'lissage': {
        masque = [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]];
      } break;
      case 'gaussien': {
        masque = [[1 / 16, 2 / 16, 1 / 16], [2 / 16, 4 / 16, 2 / 16], [1 / 16, 2 / 16, 1 / 16]];
      } break;
      case 'convolution': {
        masque = [[-5 , 0, 1], [ -1, -1, -5], [8, -1, 3]];
      } break;
      case 'rehausseur': {
        masque = [[0 , -1, 0], [ -1, 5, -1], [0, -1, 0]];
      } break;
      case 'accentuation': {
        masque = [[0, -0.5, 0], [-0.5, 3, -0.5], [0, -0.5, 0]];
      } break;
      case 'laplacien': {
        masque = [[0, 1, 0], [1, -4, 1] ,[0, 1, 0]];
      } break;
      default:
        masque = [[1, 1, 1], [1, 1, 1] ,[1, 1, 1]];
    }

    let imageData: any;
    if(isMainCanvas) imageData = ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height)
      else {
        imageData = ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      }
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue: number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.filtrageLineaire(colorRed2d,masque);
    let greenRes: any[] = this.mainService.filtrageLineaire(colorGreen2d,masque);
    let blueRes: any[] = this.mainService.filtrageLineaire(colorBlue2d,masque);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    ctx.putImageData(imageData, 0, 0);
    if(isMainCanvas) this.getHistogramme();
  }

  onSymetrie(axe) {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue : number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.symetrie(colorRed2d,axe);
    let greenRes: any[] = this.mainService.symetrie(colorGreen2d,axe);
    let blueRes: any[] = this.mainService.symetrie(colorBlue2d,axe);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.setStory("Symetrie", imageData);
  }

  onRotation180() {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue : number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.rotation180(colorRed2d);
    let greenRes: any[] = this.mainService.rotation180(colorGreen2d);
    let blueRes: any[] = this.mainService.rotation180(colorBlue2d);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.setStory("Rotation", imageData);
  }

  onEtalage() {
    this.putOriginal();
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let colorRed : number[]=[];
    let colorGreen : number[] = [];
    let colorBlue : number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let min: number;
    min = this.minimal;
    let max: number;
    max = this.maximal;
    let redRes: any[] = this.mainService.etalageDynamique(colorRed, min, max);
    let greenRes: any[] = this.mainService.etalageDynamique(colorGreen, min, max);
    let blueRes: any[] = this.mainService.etalageDynamique(colorBlue, min, max);
    let iter: number = 0;



    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.getHistogramme();
  }

  onConservateur(){
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let colorRed : number[]=[];
    let colorGreen : number[] = [];
    let colorBlue : number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.conservateur(colorRed2d);
    let greenRes: any[] = this.mainService.conservateur(colorGreen2d);
    let blueRes: any[] = this.mainService.conservateur(colorBlue2d);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.getHistogramme();
    this.setStory("Conservateur", imageData);
  }

  onMediane(isMainCanvas: boolean = true, canvas: any = this.canvas, ctx: any = this.ctx) {
    let imageData: any;
    if(isMainCanvas) imageData = ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height)
      else {
        imageData = ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      }
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue : number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.filtrageMediane(colorRed2d);
    let greenRes: any[] = this.mainService.filtrageMediane(colorGreen2d);
    let blueRes: any[] = this.mainService.filtrageMediane(colorBlue2d);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    ctx.putImageData(imageData, 0, 0);
    if(isMainCanvas) this.getHistogramme();
  }

  onFiltrageNonlineaire(nomMasque: string, isMainCanvas: boolean, canvas: any = this.canvas, ctx: any = this.ctx) {

    let masque: any[][];

    switch (nomMasque) {
      case 'erosion': {
        masque = [[255, 255, 255], [255, 255, 255],[255, 255, 255]];
      } break;
      case 'dilatation': {
        masque = [[255, 255, 255], [255, 255, 255],[255, 255, 255]];
      } break;
    }

    this.onBinarisation(false, isMainCanvas, canvas, ctx);

    let imageData: any;
    if(isMainCanvas) imageData = ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height)
      else {
        imageData = ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      }
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue: number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.filtrageNonlineaire(colorRed2d,masque,nomMasque);
    let greenRes: any[] = this.mainService.filtrageNonlineaire(colorGreen2d,masque,nomMasque);
    let blueRes: any[] = this.mainService.filtrageNonlineaire(colorBlue2d,masque,nomMasque);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    ctx.putImageData(imageData, 0, 0);
    if(isMainCanvas) this.getHistogramme();
  }

  onRotation() {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;
    console.log(imageData)

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue : number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.rotation(colorRed2d);
    let greenRes: any[] = this.mainService.rotation(colorGreen2d);
    let blueRes: any[] = this.mainService.rotation(colorBlue2d);
    let iter: number = 0;

    let newImageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.height, this.canvas.nativeElement.width);
    let newData: any[] = newImageData.data;

    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.ctx.fillRect(0, 0, this.canvas.nativeElement.height, this.canvas.nativeElement.width);

    for (let i = 0; i < newData.length; i+=4) {
      newData[i] = redRes[iter];
      newData[i + 1] = greenRes[iter];
      newData[i + 2] = blueRes[iter];
      iter++;
    }
    let self: any = this;
    createImageBitmap(newImageData).then(function(imgBitmap) {
      self.canvas.nativeElement.width = newImageData.width;
      self.ctx.drawImage(imgBitmap, 0, 0, newImageData.width, newImageData.height);
      self.setStory("Rotation 90", newImageData);
    });
    // this.ctx.putImageData(newImageData, 0, 0);
    // this.setStory("Rotation 90", newImageData);
    // let img = new Image();

    // img.onload = function(){
    //   let imgHeight = self.canvas.nativeElement.height;
    //   self.canvas.nativeElement.width = imgHeight;
    //   self.ctx.drawImage(img, 0, 0, self.canvas.nativeElement.height, self.canvas.nativeElement.height);
    // }
    // img.src = this.canvas.nativeElement.toDataURL("image/png");

    // setTimeout(function(){
    //   self.putOriginal();
    // }, 20)

  }

}
