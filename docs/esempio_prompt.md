Seguendo la rigorosità delle specs presenti nella cartella docs copy/specs/* e i criteri stabiliti nello            
stream-coding per la realizzazione delle specs andiamo a creare nella docs/specs un file auth.md che contenga una   
specs finalizzata alla realizzazione del seguente obiettivo:                                                        
in primis deve essere creato un nuovo endpoint relativo alla creazione dell'account, per intenderci andremo a creare
 nel controller C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\backend\src\main\java\it\e
vodev\instagram\auth\controllers\PublicAuthController.java un nuovo endpoint che vada a fare ciò che faceva prima   
C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\frontend\src\app\api\auth\register\route.t
s.                                                                                                                  
Ovviamente il tutto deve avvenire seguendo le logiche previste nel copilot instructions.                            
Di conseguenza ora dovremo fare principlamente questo:                                                              
 - andremo a modificare su liquidbase le tabelle per utilizzare l'uuid v7 invece dell'attuale id come chiave        
primaria delle tabelle. Per modificare l'uuid vai a creare un nuovo changeSet direttamente nel changelog-<entità>   
non creare un nuovo file di changelog, sarebbe errato!                                                              
- dopo aver fatto questa modifica effettua i relativi cambiamenti sui model se necessari o comunque dove serve sul  
be                                                                                                                  
- dopo aver apportato le modifiche sul be procedi con la creazione del nuovo endpoint seguendo le logiche già       
specificate                                                                                                         
- dopo la creazione dell'endpoint con tutta la sua logica procedi alla realizzazione della chiamata postman (nello  
specifico qui bisogna farlo in                                                                                      
C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\postman\collections\Auth\Public)          
                                                                                                                    
dopo aver fatto tutto ciò procedi con la fase del fe andando a popolare la cartella                                 
C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\frontend\src\features\auth come è fatto in
  C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\frontend\src\features\example andando   
quindi a creare i relativi schemi zod e i le action relative all'autenticazione.                                    
nota che attualmente la logica dell'auth dovrebbe trovarsi nella parte di                                           
C:\Users\Cristian\Documents\GitHub\instagram-reverse-engineering-enhanced\frontend\src\lib\auth prendi ciò che ti   
serve e ripuliamo la parte di auth  