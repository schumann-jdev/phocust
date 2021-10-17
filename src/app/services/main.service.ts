export class MainService {
  binarisation(colorI: number[], histoI): any {
    let seuil: number = colorI[this.withinClassVariance(histoI).indexOf(Math.min(...this.withinClassVariance(histoI)))];
    let result: number[] = [];
    colorI.forEach(item => {
      item < seuil ? result.push(0) : result.push(255);
    });
    return result;
  }

  equalization(colorI: number[], histoI: number[]): any {
    if(colorI.length != histoI.length) {
      return null;
    } else {
      let colorRes: number[] = [];
      let histoJ: number[] = this.equalize(histoI);
      let histoCumulJ: number[] = this.histoCumul(histoJ);

      return new Promise((success, errors) =>{
        colorI.forEach(index => {
          colorRes.push(Number(((colorI[colorI.length - 1] - 1) * histoCumulJ[index]).toFixed(0)));
        });
        if(colorRes.length > 0){
            success(colorRes);
        } else {
            errors("Erreur");
        }
      });
    }
  }

  equalize(histoI: number[]): number[] {
    let res:number[] = [];
    let histoCumulI: number[] = this.histoCumul(histoI);
    histoI.forEach(item => {
      res.push(item/histoCumulI[histoCumulI.length - 1]);
    });
    return res;
  }

  histoCumul(histo: number[]): any[] {
    let res: any[] = [];
    let iter: number = 0;
    histo.forEach(item => {
        iter += item;
        res.push(iter);
    });
    return res;
  }

  valueForHistoEqualize(histCumul: any[]): any{
    let a: number = histCumul.length
    let b: number = histCumul[histCumul.length-1];
    let res: any = b/a;
    return res;
  }

  equalizeNearHisto(colorI: number[], histoI: number[]): any {
    if(colorI.length === histoI.length){
      let histoCumulI: number[] = this.histoCumul(histoI);
      let histoJ: number[] =[];

      colorI.forEach(() => {
        histoJ.push(this.valueForHistoEqualize(histoCumulI))
      });

      let histoCumulJ: number[] = this.histoCumul(histoJ);

      let couleurRes: number[] = [];

      colorI.forEach(index => {
          function boucle() {
              let diffHistoCumul: number[] = [];
              return new Promise((success, errors) =>{
                  histoCumulJ.forEach((elem) => {
                      diffHistoCumul.push(histoCumulI[index] - elem < 0 ? (histoCumulI[index] - elem)*-1: histoCumulI[index] - elem);
                  });
                  if(diffHistoCumul.length > 0){
                      success(diffHistoCumul);
                  } else {
                      errors(diffHistoCumul);
                  }
              });
          }
          const promise: any = boucle();
          promise.then(
              function(diffHistoCumul: any){
                  couleurRes.push(colorI[histoCumulJ.indexOf(histoCumulJ[diffHistoCumul.indexOf(Math.min(...diffHistoCumul))])]);
              },
              function(error: any){
                  console.log("promise erreur "+error.length);
              }
          )

      });
      return new Promise((success, error) => {
        success(couleurRes);
        error("erreur");
      })
    }  else{
        console.log("vous m'avez donné des valeurs incohérant");
        return null;
    }
  }

  refactorData(imageMatrice: any): any {
    let resObject: any = {};
    let resArray: any[] = [];
    imageMatrice.forEach((item: any[]) => {
        item.forEach(elem => {
            !resObject[elem] ? resObject[elem] = 1: ++resObject[elem];
            resArray.push(elem);
        });
    });
    return {"histo": resObject, "arr":resArray};
  }

  refactorColorData(colorArray: any[]): any {
    let resObject: any = {};
    let resArray: any[] = [];
    colorArray.forEach((item) => {
      !resObject[item] ? resObject[item] = 1: ++resObject[item];
      resArray.push(item);
    });
    return {"histo": resObject, "arr":resArray};
  }

  calculHisto(objectOfDataRefactored: any): any {
    return Object.values(objectOfDataRefactored)
  }

  makeColorArray(objectOfDataRefactored: any): any[] {
    let res: any[] = [];
    let resTemp = Object.keys(objectOfDataRefactored);
    resTemp.forEach(item => {
        res.push(Number(item));
    })
    return res;
  }

  withinClassVariance(colorHisto: any[]): any[] {
    let cumul: any[] = this.histoCumul(colorHisto);
    let weightBack: number = 0;
    let weightForm: number = 0;
    let result: any[] = [];
    colorHisto.forEach((item, index) => {
      let meanBack: number = 0;
      let sommeForMeanB: number = 0;
      let varianceBack: number = 0;
      let sommeForVarianceB: number = 0;
      let sommeForWeightBack: number = 0;
      let meanForm: number = 0;
      let sommeForMeanF: number = 0;
      let varianceForm: number = 0;
      let sommeForVarianceF: number = 0;
      let sommeForWeightForm: number = 0;
      for(let i=0; i < index; i++) {
        sommeForMeanB += colorHisto[i]*i;
        sommeForWeightBack += colorHisto[i];
      }
      meanBack = sommeForMeanB/cumul[index];
      for(let i=0; i < index; i++) {
        sommeForVarianceB += Math.pow((i-meanBack), 2)*colorHisto[i];
      }
      varianceBack = sommeForVarianceB/cumul[index];

      for(let i=index; i < colorHisto.length; i++) {
        sommeForMeanF += colorHisto[i]*i;
        sommeForWeightForm += colorHisto[i];
      }
      meanForm = sommeForMeanF/sommeForWeightForm;
      for(let i=index; i < colorHisto.length; i++) {
        sommeForVarianceF += Math.pow((i-meanForm), 2)*colorHisto[i];
      }
      varianceForm = sommeForVarianceF/sommeForWeightForm;
      weightBack = sommeForWeightBack / cumul[cumul.length - 1];
      weightForm = sommeForWeightForm / cumul[cumul.length - 1];
      result.push(weightBack*varianceBack + weightForm*varianceForm);
    });
    return result;
  }

  filtrageLineaire(dataColor: any[][], masque: any[][]): any {
    let resultat: any[] = [];
    let resultmasque: number[] = [];
    for (let imasque = masque.length - 1; imasque >= 0; imasque--) {
      for (let jmasque = masque[imasque].length - 1; jmasque >= 0; jmasque--) {
        resultmasque.push(masque[imasque][jmasque]);
      }

    }
    let longueur: number = Math.floor((masque.length) / 2);

    for (let i = 0; i < dataColor.length; i++) {
      for (let j = 0; j < dataColor[0].length; j++) {

        let voisin: number = 0;

        let result: number[] = [];

        for (let x = i - longueur; x <= i + longueur; x++) {
          for (let y = j - longueur; y <= j + longueur; y++) {

            if (x < 0 || y < 0 || x >= dataColor.length || y >= dataColor[0].length) {
              voisin = 0;
            } else {
              voisin = dataColor[x][y];
            }
            result.push(voisin);
          }
        }
        let reponse: number = 0;

        for (let m = 0; m < result.length; m++) {
          reponse += (result[m] * resultmasque[m]);
        }

        if (reponse < 0) {
          resultat.push(0);
        } else if (reponse > 255) {
          resultat.push(255);
        } else {
          resultat.push(reponse);
        }
      }
    }
    return resultat;
  }

  symetrie(dataColor: any[][], axe: any) {
    switch (axe) {
      case "absisse": {
        let result = [];
        for (let i = 0; i < dataColor.length; i++) {
          let res = 0;
          for (let j = 0; j < dataColor[i].length; j++) {
            res = dataColor[dataColor.length - 1 - i][j];
            result.push(res)
          }
        }
        return result;
      } break;
      case "ordonne": {
        let result = [];
        for (let i = 0; i < dataColor.length; i++) {
          let res = 0;
          for (let j = 0; j < dataColor[i].length; j++) {
            res = dataColor[i][dataColor[i].length - 1 - j];
            result.push(res);
          }
        }
        return result;
      } break;
    }

  }

  rotation180(dataColor: any[][]){
    let result = [];
    for (let i = 0; i < dataColor.length; i++) {
		for (let j = 0; j < dataColor[i].length; j++) {
        let res = 0;
        res = dataColor[dataColor.length - 1 - i][dataColor[i].length - 1 - j];
        result.push(res)
      }
	  }
    return result;
  }
  etalageDynamique(img:any [], min: number, max: number): any{
    let resultat: any = [];

    for(let i = 0; i < img.length; i++){
        let result: number = 0;
        result = (255*(img[i]-min))/(max-min);

        if(result < 0){
          result = 0;
        }else if(result > 255){
          result = 255;
        }
        resultat.push(Math.round(result));
      }

    return resultat;
  }

  etalage(img: any[], min: any, max: any): any {
    let result: any = [];
    let lastResult: any = [];
    for(let i = 0; i <= 255; i++) {
      let resultTemp: any = 255 * (i-min) / (max - min);
      if(resultTemp < min) resultTemp = min;
       else if(resultTemp > max) resultTemp = max;
      result[i] = Math.floor(resultTemp);
    }
    for(let i = 0; i < img.length; i++) {
      lastResult[i] = result[img[i]]
    }
    return lastResult;
  }

  conservateur(dataColor:any[][]): any{
    let resultat: number[] = [];
      for(let i = 0; i<dataColor.length; i++){
        for(let j = 0; j<dataColor[0].length; j++){

         let valeur : number = dataColor[i][j];

         let voisin : number = 0;

          let result: any[] = [];

          for (let x = i-1; x <= i+1; x++) {
            for (let y = j-1; y <=j+1; y++) {
              if(x<0 || y<0 || x>=dataColor.length || y>=dataColor[0].length){
                voisin = 0;
              }else{
                voisin = dataColor[x][y];
              }
              result.push(voisin);
            }
          }

         let tabl : any[] = [];

          for(let a = 0; a < result.length; a++){

            if(a == 4){

            }else{
              tabl.push(result[a]);
            }
          }
          let min : number = Math.min(...tabl);

          let max : number = Math.max(...tabl);
          let response: number = 0;

          if(valeur < min){
            response = min;
          }else if(valeur > max){
            response = max;
          }else{
            response = valeur;
          }
          resultat.push(response);
        }
      }
    return resultat;
  }

  filtrageMediane(dataColor: any[][]): any {
    let resultat: any[] = [];
    for (let i = 0; i < dataColor.length; i++) {
      for (let j = 0; j < dataColor[0].length; j++) {

        let voisin: number = 0;

        let result: number[] = [];

        for (let x = i - 1; x <= i + 1; x++) {
          for (let y = j - 1; y <= j + 1; y++) {

            if (x < 0 || y < 0 || x >= dataColor.length || y >= dataColor[0].length) {
              voisin = 0;
            } else {
              voisin = dataColor[x][y];
            }
            result.push(voisin);
          }
        }

        result.sort(function (a, b) {
          return a - b
        });

        resultat.push(result[4]);

      }
    }
    return resultat;
  }

  filtrageNonlineaire(dataColor: any[][], masque: any[][],nonLineaire: any): any {
    let resultat: any[] = [];
    let resultmasque: number[] = [];
    for (let imasque = 0; imasque <masque.length ; imasque++) {
      for (let jmasque = 0; jmasque  <masque[imasque].length; jmasque++) {
        resultmasque.push(masque[imasque][jmasque]);
      }

    }
    let longueur: number = Math.floor((masque.length) / 2);

    for (let i = 0; i < dataColor.length; i++) {
      for (let j = 0; j < dataColor[0].length; j++) {

        let voisin: number = 0;

        let result: number[] = [];

        for (let x = i - longueur; x <= i + longueur; x++) {
          for (let y = j - longueur; y <= j + longueur; y++) {

            if (x < 0 || y < 0 || x >= dataColor.length || y >= dataColor[0].length) {
              voisin = 0;
            } else {
              voisin = dataColor[x][y];
            }
            result.push(voisin);
          }
        }
        let reponse: number = 0;
        switch (nonLineaire) {
          case "erosion": {
            if (result.length == resultmasque.length && result.every((value, index) => value == resultmasque[index])) {
              reponse = 255;
            } else {
              reponse = 0;
            }
            resultat.push(reponse);
          } break;

          case "dilatation": {
            for (let i = 0; i < result.length; i++) {
              if (result[i] == resultmasque[i]) {
                reponse = 255;
              }
            }
            resultat.push(reponse);
          } break;
        }
      }
    }
    return resultat;
  }

  rotation(dataColor: any[][]){
    let result = [];
    for (let i = 0; i < dataColor[0].length; i++) {
      for (let j = 0; j < dataColor.length; j++) {
        let res = 0;
        res = dataColor[dataColor.length - 1 - j][i];
        result.push(res)
      }
    }
    return result;
  }


}
