import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CarUploadZoneProps {
  viewType: 'front' | 'back' | 'left_side' | 'right_side' | 'top';
  viewLabel: string;
  onUpload: (file: File, result: ValidationResult) => void;
}

interface ValidationResult {
  detectedView: string;
  expectedView: string;
  isMatch: boolean;
  confidence: number;
}

export const CarUploadZone: React.FC<CarUploadZoneProps> = ({
  viewType,
  viewLabel,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      validateImage(result, selectedFile);
    };
    reader.readAsDataURL(selectedFile);
  };

  const validateImage = async (imageDataUrl: string, file: File) => {
    setIsValidating(true);
    setValidation(null);

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
      setValidation(result);
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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getValidationIcon = () => {
    if (isValidating) return <AlertCircle className="w-5 h-5 text-warning animate-pulse" />;
    if (!validation) return null;
    
    if (validation.isMatch) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    } else {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getValidationMessage = () => {
    if (isValidating) return "Validating image...";
    if (!validation) return null;
    
    if (validation.isMatch) {
      return `✅ Perfect match! ${viewLabel} view detected`;
    } else {
      return `❌ Mismatch: Expected ${viewLabel}, detected ${validation.detectedView.replace('_', ' ')} view`;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-card shadow-card hover:shadow-elegant transition-smooth">
      <div 
        className={cn(
          "aspect-square relative cursor-pointer transition-smooth",
          !file && "border-2 border-dashed border-border hover:border-primary/50"
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt={`${viewLabel} view`}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-smooth flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Change Image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-upload flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{viewLabel}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Drop your {viewLabel.toLowerCase()} view image here or click to browse
            </p>
            <Button variant="upload" size="sm">
              <Camera className="w-4 h-4" />
              Select Image
            </Button>
          </div>
        )}

        {/* Validation Status */}
        {(validation || isValidating) && (
          <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm p-3 border-t">
            <div className="flex items-center gap-2">
              {getValidationIcon()}
              <p className={cn(
                "text-sm font-medium",
                validation?.isMatch ? "text-success" : "text-destructive",
                isValidating && "text-warning"
              )}>
                {getValidationMessage()}
              </p>
            </div>
            {validation && (
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round(validation.confidence * 100)}%
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};