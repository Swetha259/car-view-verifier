import React, { useState } from 'react';
import { CarUploadZone } from '@/components/CarUploadZone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Car, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  validation: {
    detectedView: string;
    expectedView: string;
    isMatch: boolean;
    confidence: number;
  };
}

interface UploadState {
  front: UploadedFile | null;
  back: UploadedFile | null;
  left_side: UploadedFile | null;
  right_side: UploadedFile | null;
  top: UploadedFile | null;
}

const Index = () => {
  const [uploads, setUploads] = useState<UploadState>({
    front: null,
    back: null,
    left_side: null,
    right_side: null,
    top: null,
  });

  const handleUpload = (viewType: keyof UploadState, file: File, validation: any) => {
    setUploads(prev => ({
      ...prev,
      [viewType]: { file, validation }
    }));
  };

  const getUploadStats = () => {
    const total = 5;
    const uploaded = Object.values(uploads).filter(Boolean).length;
    const validated = Object.values(uploads).filter(u => u?.validation.isMatch).length;
    
    return { total, uploaded, validated };
  };

  const stats = getUploadStats();
  const allValidated = stats.validated === 5;
  const hasUploads = stats.uploaded > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ford Vehicle Photo Validation</h1>
              <p className="text-primary-foreground/80">AI-powered car image verification system</p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.uploaded}/5</div>
                  <div className="text-sm text-primary-foreground/80">Uploaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.validated}/5</div>
                  <div className="text-sm text-primary-foreground/80">Validated</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    allValidated ? "text-green-300" : "text-yellow-300"
                  )}>
                    {allValidated ? "100%" : hasUploads ? `${Math.round((stats.validated / stats.uploaded) * 100)}%` : "0%"}
                  </div>
                  <div className="text-sm text-primary-foreground/80">Match Rate</div>
                </div>
              </div>
              
              {allValidated && (
                <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="font-medium text-green-300">All Images Validated</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Instructions */}
        <Card className="mb-8 p-6 bg-gradient-card shadow-card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Upload Vehicle Photos</h2>
              <p className="text-muted-foreground mb-4">
                Our AI system will automatically verify that each photo matches the expected view angle. 
                Upload high-quality images showing clear views of the vehicle from each specified angle.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Front view: Show headlights, grille, and front bumper</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Back view: Show taillights, rear bumper, license plate area</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Left side: Complete left side profile of the vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Right side: Complete right side profile of the vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Top view: Overhead view showing roof, hood, and trunk</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <CarUploadZone
            viewType="front"
            viewLabel="Front View"
            onUpload={(file, validation) => handleUpload('front', file, validation)}
          />
          <CarUploadZone
            viewType="back"
            viewLabel="Back View"
            onUpload={(file, validation) => handleUpload('back', file, validation)}
          />
          <CarUploadZone
            viewType="left_side"
            viewLabel="Left Side"
            onUpload={(file, validation) => handleUpload('left_side', file, validation)}
          />
          <CarUploadZone
            viewType="right_side"
            viewLabel="Right Side"
            onUpload={(file, validation) => handleUpload('right_side', file, validation)}
          />
          <div className="md:col-span-2 lg:col-span-1 mx-auto max-w-sm lg:max-w-none">
            <CarUploadZone
              viewType="top"
              viewLabel="Top View"
              onUpload={(file, validation) => handleUpload('top', file, validation)}
            />
          </div>
        </div>

        {/* Validation Summary */}
        {hasUploads && (
          <Card className="p-6 bg-gradient-card shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Validation Summary
            </h3>
            <div className="space-y-3">
              {Object.entries(uploads).map(([viewType, upload]) => {
                if (!upload) return null;
                
                const viewLabels = {
                  front: 'Front View',
                  back: 'Back View',
                  left_side: 'Left Side',
                  right_side: 'Right Side',
                  top: 'Top View'
                };
                
                return (
                  <div key={viewType} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {upload.validation.isMatch ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{viewLabels[viewType as keyof typeof viewLabels]}</p>
                        <p className="text-sm text-muted-foreground">
                          {upload.validation.isMatch 
                            ? `✅ Correct ${viewType.replace('_', ' ')} view detected`
                            : `❌ Expected ${viewType.replace('_', ' ')}, got ${upload.validation.detectedView.replace('_', ' ')}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.round(upload.validation.confidence * 100)}% confidence
                      </p>
                      <p className="text-xs text-muted-foreground">{upload.file.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {allValidated && (
              <div className="mt-6 pt-4 border-t border-border">
                <Button size="lg" className="w-full">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit All Photos
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;