import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CreateNewProps {
  go?: string;
  text?: string;
}

const CreateNew: React.FC<CreateNewProps> = ({ 
  go = '/', 
  text = 'Create New Item' 
}) => {
  const handleNavigate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.location.href = go;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 transition-all duration-200 mt-4">
      <Card>
      <CardContent>
        <div className={cn(
        "p-6 rounded-xl",
        "dark:bg-transparent",
        "transition-colors duration-200 flex justify-center items-center",
        )}>
        <img 
          src="/assets/svgs/empty-box.svg"
          alt="Create New"
          className="w-120 h-60 object-contain"
        />
        </div>
        <div className="flex flex-col items-center justify-center mb-4">
        <h1 className="font-semibold text-2xl">😿 Nothing Found</h1>
        <Button 
          onClick={handleNavigate}
          className="text-lg px-6 py-3 font-doto mt-4 hover:animate-pulse"
          size="sm"
        >
          {text}
        </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  );
};

export default CreateNew;