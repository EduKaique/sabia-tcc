self.onmessage = function(e) {
  const { code } = e.data;
  
  try {
    let output = [];
    
    const originalLog = console.log;
    console.log = (...args) => {
      output.push(args.join(' '));
    };

    eval(code);

    console.log = originalLog;
    self.postMessage({ success: true, output: output.join('\n') });
    
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};