window.onload = function() {
    $("#tables").hide()
    var fileInput = document.getElementById('fileInput');
    var fileDisplayArea = document.getElementById('fileDisplayArea');
    var fileDisplayArea2 = document.getElementById('fileDisplayArea2');
    var jobStream = []
    var jobTime = []
    var memory = []
    var sortedMemory = []
    var jobQueue = []
     var assignedProcesses = []
     var finishedProcesses = 0
    var completedProcesses = []
    var queuedProcesses = []
     var buffer = []
     var time
     var SPEED = 1000
    const MEMSIZE = 50000
     var state = false
      var re = /\s+/
    
     fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0];
        var textType = /text.*/;
       
     

        if (file.type.match(textType)) {
            var reader = new FileReader();

            reader.onload = function(e) {
                
                fileDisplayArea.innerText = reader.result;
                var lines = this.result.split('\n');
                
                listParser("job", lines)
                
                startAllocation()
                
            }



            reader.readAsText(file); 

              

        } else {
            fileDisplayArea.innerText = "File not supported!"
        }
        
    });
       function print(message) {
      
    }
     fileInput2.addEventListener('change', function(e) {
        var file = fileInput2.files[0];
        var textType = /text.*/;
     

        if (file.type.match(textType)) {
            var reader2 = new FileReader();

            reader2.onload = function(e) {
            
                fileDisplayArea2.innerText = reader2.result;
                var lines = this.result.split('\n');
              
                listParser("memory", lines)
                startAllocation();
            }


            reader2.readAsText(file); 
             
              

        } else {
            fileDisplayArea2.innerText = "File not supported!"
        }
       
    });
     function startAllocation () {
         if(memory.length!=0 && jobStream.length!=0) {
            
             worstFit(memory, jobStream)
         }
     }
     $("#play").click(function() {
         var stop = $("#play").hasClass("btn-success")
         if(stop) {
              $("#play").removeClass("btn-success")
              $("#play").addClass("btn-danger")
              state = false
         } else {
             state = true
              $("#play").removeClass("btn-danger")
             $("#play").addClass("btn-success")
             firstFit(memory, jobStream)
         }
     })
     function toggleState() {
         if(state== true) {
             state = false
         } else {
             state = true
         }
     }
     function listParser (listType, lines) {
         if(listType == "job") {
             for(var line = 1; line < lines.length; line++){
                      var word = lines[line];
                      word = word.split(re)
                      var job = {
                          number : parseInt(word[0]),
                          time : parseInt(word[1]),
                          size : parseInt(word[2]),
                        waitingTime : 0 ,
                        assigned : false,
                        finished : false,

                      }

                  jobStream.push(job)
              }
         }
         if (listType == "memory") {
             for(var line = 1; line < lines.length; line++){
                      var word = lines[line];
                      word = word.split(re)
                      var block = {
                          number : word[0],
                          size : word[1],
                        allocated : false,
                        intFragmentation: word[1]



                      }

                  memory.push(block)
         }

     }
 }

 function throughput() {
    var counter = 0;
    for(var i = 0; i < jobTime.length; i++) {
        if(jobTime[i]) {
            if(jobTime[i].number != null) counter++;
        }
    }
    return "" + counter + " jobs per second."
 }
 function memoryStatus() {
    var throughput = $("#throughput")
    var internalFrag = $("#internalFrag")
    var storageUtil = $("#storageUtil")

  
    var totalFrag = 0;
    var counter = 0;
    var totalSize = 0;

    throughput.empty();
    internalFrag.empty();
    storageUtil.empty();

    for(var i = 0; i < jobTime.length; i++) {
        if(jobTime[i]) {
            if(jobTime[i].number != null) {
                counter++;
                totalFrag+= memory[i].intFragmentation
                totalSize+= jobTime[i].size
               
            }
        }
    }
    var used = totalSize / MEMSIZE * 100 
    var unused = (MEMSIZE - totalSize)  / MEMSIZE * 100

    throughput.append("" + counter + " jobs per second.")
    internalFrag.append(totalFrag)
    storageUtil.append("Used: " + used + " Unused: "  + unused )

   
 }

 function jobStatus() {
    var waiting = 0
    var waitingProcesses = $("#waiting")
 
    waitingProcesses.empty()

    var completed = $("#completed")
   
   completed.empty();
    
    for(var i  = 0; i < jobStream.length; i++) {
        if(jobStream[i].assigned == false) {
            waitingProcesses.append("Job " + jobStream[i].number + "<br>")
            waiting++
        } else {
            if(jobStream[i].finished == true)
           
            completed.append("Job " + jobStream[i].number + "    waiting time: " + jobStream[i].waitingTime +"<br>") 
        }
    }
    waitingProcesses.append(" (" + waiting + ")")

 }

function firstFit(memory, jobStream) {
     
     placementAlgorithm(memory, jobStream)
     
 }	
 function bestFit(memory, jobStream) {
    sortedMemory = JSON.parse(JSON.stringify(memory)).sort(sortOnSize)
    placementAlgorithm(sortedMemory, jobStream)
 }
 function worstFit(memory, jobStream) {
    sortedMemory = JSON.parse(JSON.stringify(memory)).sort(sortOnSizeDec)
    placementAlgorithm(sortedMemory, jobStream)

 }
 async function placementAlgorithm(memory, jobStream) {
    time = 0 
    var x = 0
    var i = 0
    var assigned = false
    var excess = 0
    
    SPEED = 1000
    var memoryCopy = memory.concat().sort(sortOnSize)
    for(var i = 0; i < jobStream.length; i++) {
        if(jobStream[i].size > memoryCopy[memoryCopy.length - 1].size) {
            excess++
        }
    }

    while(finishedProcesses < jobStream.length - excess) {
        i = 0
        while(i < jobStream.length) {
            console.log("" + i + "," + jobStream[i].assigned)
            if(jobStream[i].assigned == false) {
               for(var ctr = 0; ctr < buffer.length; ctr++) {
                    var unassignedJob = buffer[ctr]
                    if(assignJob(unassignedJob.number-1, memory)==true) {
                        buffer.splice(unassignedJob.number-1) 
                        jobStream[i].waitingTime = time
                    }   
                }   
                if(assignJob(i, memory)==false) { 
                    buffer.push( jobStream[ i ] ) 
                } else {
                    jobStream[i].waitingTime = time
                }  
            }
            i++ 
        }
        jobTime = updateRemainingTime(jobTime) 
        time ++
        updateTable(time)
        await sleep(SPEED)
    }
 }

 async function assignJob (i, memArr) {
    var idx
     var j = 0
     var assigned = false
     while (j < memArr.length) {
        if(memArr == sortedMemory) {
            idx = sortedMemory[j].number - 1
        } else {
            idx = j
        }
         if(!jobTime[idx]) {
             jobTime[idx] = {
                 time: 0,
                 number: null

             }
         } 
         if(jobTime[idx].time == 0) { 
             if(memArr[j].size >= jobStream[i].size) { 
                 allocateMemory(i, idx)
                assigned = true
                 break;
            }
        }
         j++	
    }
    return assigned;
}

var sortOnOrder = function (a,b) {
    return a.number - b.number
}
var sortOnSize = function (a,b) { 
    return a.size- b.size
}
var sortOnSizeDec = function (a, b) {
    return b.size - a.size
}
 function updateRemainingTime(jobTime) {

     for(var i = 0; i < jobTime.length; i++) {
         if(jobTime[i].time >0) { 
             jobTime[i].time --	
         } 
         if(jobTime[i].time == 0 && jobTime[i].number!=null) {
                var idx = jobTime[i].number-1
               
               jobStream[idx].finished = true
                 freeMemory(i)
         }
     }
     return jobTime
 }

 function allocateMemory(i, idx) {
    memory[idx].allocated = true;

    
    jobQueue[idx] = jobStream[i]
    jobTime[idx].time = jobStream[i].time
    jobTime[idx].number = jobStream[i].number
    jobTime[idx].size = jobStream[i].size
    memory[idx].intFragmentation = memory[idx].size - jobStream[i].size
    jobTime[idx].usedSpace = jobStream[i].size
    jobStream[i].assigned = true


 }
 function freeMemory(origIdx) {
    memory[origIdx].allocated = false
    finishedProcesses++ 
    jobQueue[origIdx] = null
    jobTime[origIdx].number = null 
 }
 function sleep(ms) {
     return new Promise(resolve => setTimeout(resolve, ms));
 }
 function updateTable(time) {
     $("#counter").html(time)
     $("#tableBody").empty()

         for(var i = 0; i < memory.length; i++) {
             var job = jobQueue[i]
             if(!job) { 
                 job = {
                     number:'',
                     size:'',

                 }
             } 
            
             var tr = document.createElement('tr')
             $(tr).append('<th scope = "row">'+ memory[i].number + '</th>')//name
             $(tr).append('<td>'+ memory[i].size + 'K</td>') //size
             $(tr).append('<td>'+ job.number + '</td>') //name
             $(tr).append('<td>'+ (job.size == ''? '': (job.size +'K')) + '</td>') //size
             $(tr).append('<td>'+ (jobTime[i].time ==''? '': (jobTime[i].time + 's'))+'</td>') //time remaining
            $(tr).append('<td>'+ (jobTime[i].time == ''? '': memory[i].intFragmentation + 'K')+ '</td>')
             $("#tableBody").append(tr)

         }
        memoryStatus()
        jobStatus()
  
 }
}