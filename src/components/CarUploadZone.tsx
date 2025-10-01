import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CarUploadZoneProps {
  viewType: 'front' | 'back' | 'side' | 'top';
  viewLabel: string;
  onUpload: (file: File, result: ValidationResult) => void;
  allowMultiple?: boolean;
}

interface ValidationResult {
  detectedView: string;
  expectedView: string;
  isMatch: boolean;
  confidence: number;
  analysis?: {
    make: string;
    model: string;
    color: string;
    condition: string;
    damage: string;
    features: string;
  };
}

export const CarUploadZone: React.FC<CarUploadZoneProps> = ({
  viewType,
  viewLabel,
  onUpload,
  allowMultiple = false,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles).filter(file => file.type.startsWith('image/'));
    
    if (!allowMultiple) {
      // Single file mode
      const selectedFile = fileArray[0];
      if (!selectedFile) return;
      
      setFiles([selectedFile]);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviews([result]);
        validateImage(result, selectedFile, 0);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // Multiple files mode
      setFiles(fileArray);
      
      fileArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPreviews(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = result;
            return newPreviews;
          });
          validateImage(result, file, index);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const validateImage = async (imageDataUrl: string, file: File, index: number) => {
    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('classify-car-view', {
        body: {
          imageBase64: imageDataUrl,
          expectedView: viewType
        }
      });

      if (error) {
        console.error('Validation error:', error);
        return;
      }

      const result = data as ValidationResult;
      setValidations(prev => {
        const newValidations = [...prev];
        newValidations[index] = result;
        return newValidations;
      });
      onUpload(file, result);
    } catch (error) {
      console.error('Error validating image:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getValidationIcon = (index: number = 0) => {
    if (isValidating) return <AlertCircle className="w-5 h-5 text-warning animate-pulse" />;
    if (!validations[index]) return null;
    
    if (validations[index].isMatch) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    } else {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getValidationMessage = (index: number = 0) => {
    if (isValidating) return "Validating image...";
    if (!validations[index]) return null;
    
    if (validations[index].isMatch) {
      return `✅ Perfect match! ${viewLabel} view detected`;
    } else {
      return `❌ Mismatch: Expected ${viewLabel}, detected ${validations[index].detectedView.replace('_', ' ')} view`;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-card shadow-card hover:shadow-elegant transition-smooth">
      <div 
        className={cn(
          allowMultiple ? "min-h-48" : "aspect-square",
          "relative cursor-pointer transition-smooth",
          files.length === 0 && "border-2 border-dashed border-border hover:border-primary/50"
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={allowMultiple}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) handleFileSelect(files);
          }}
          className="hidden"
        />

        {files.length > 0 ? (
          <div className={cn(
            "relative w-full h-full",
            allowMultiple ? "grid grid-cols-2 gap-2 p-2" : ""
          )}>
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={previews[index]}
                  alt={`${viewLabel} view ${index + 1}`}
                  className={cn(
                    "object-cover rounded-lg",
                    allowMultiple ? "w-full h-32" : "w-full h-full"
                  )}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                  <div className="text-white text-center">
                    <Camera className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs font-medium">
                      {allowMultiple ? `Image ${index + 1}` : 'Change Image'}
                    </p>
                  </div>
                </div>
                
                {/* Individual validation status for multiple images */}
                {allowMultiple && validations[index] && (
                  <div className="absolute top-1 right-1">
                    {validations[index].isMatch ? (
                      <CheckCircle className="w-4 h-4 text-success bg-white rounded-full" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive bg-white rounded-full" />
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {allowMultiple && files.length < 4 && (
              <div className="border-2 border-dashed border-border rounded-lg flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs">Add more</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-upload flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{viewLabel}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Drop your {viewLabel.toLowerCase()} view {allowMultiple ? 'images' : 'image'} here or click to browse
              {allowMultiple && <span className="block text-xs mt-1">You can upload multiple images</span>}
            </p>
            <Button variant="upload" size="sm">
              <Camera className="w-4 h-4" />
              Select {allowMultiple ? 'Images' : 'Image'}
            </Button>
          </div>
        )}

        {/* Validation Status */}
        {!allowMultiple && (validations[0] || isValidating) && (
          <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm p-3 border-t">
            <div className="flex items-center gap-2">
              {getValidationIcon(0)}
              <p className={cn(
                "text-sm font-medium",
                validations[0]?.isMatch ? "text-success" : "text-destructive",
                isValidating && "text-warning"
              )}>
                {getValidationMessage(0)}
              </p>
            </div>
            {validations[0] && (
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round(validations[0].confidence * 100)}%
              </p>
            )}
          </div>
        )}
        
        {/* Multiple images summary */}
        {allowMultiple && validations.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm p-3 border-t">
            <p className="text-sm font-medium">
              {validations.filter(v => v.isMatch).length}/{validations.length} images validated
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};