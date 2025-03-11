import React from 'react';
import * as Chakra from '@chakra-ui/react';

const ChakraTest: React.FC = () => {
  console.log('Available Chakra UI components:', Object.keys(Chakra));
  
  return (
    <div>
      <h1>Chakra UI Test</h1>
    </div>
  );
};

export default ChakraTest; 