import React, { useState } from 'react';
import { CarUploadZone } from '@/components/CarUploadZone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import fordLogo from '@/assets/ford-logo.jpg';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UploadedFile {
  file: File;
  validation: {
    detectedView: string;
    expectedView: string;
    isMatch: boolean;
    confidence: number;
    quality?: {
      qualityScore: number;
      isBlurry: boolean;
      sharpness: string;
      issues: string;
    };
    analysis?: {
      make: string;
      model: string;
      color: string;
      condition: string;
      damage: string;
      features: string;
    };
  };
}

interface UploadState {
  front: UploadedFile | null;
  back: UploadedFile | null;
  side: UploadedFile[] | null;
  top: UploadedFile | null;
}

const Index = () => {
  const [uploads, setUploads] = useState<UploadState>({
    front: null,
    back: null,
    side: null,
    top: null,
  });

  const handleUpload = (viewType: keyof UploadState, file: File, validation: any) => {
    if (viewType === 'side') {
      setUploads(prev => ({
        ...prev,
        side: prev.side ? [...prev.side, { file, validation }] : [{ file, validation }]
      }));
    } else {
      setUploads(prev => ({
        ...prev,
        [viewType]: { file, validation }
      }));
    }
  };

  const getUploadStats = () => {
    const total = 4;
    let uploaded = 0;
    let validated = 0;
    
    // Count regular uploads
    ['front', 'back', 'top'].forEach(key => {
      if (uploads[key as keyof UploadState]) {
        uploaded++;
        if ((uploads[key as keyof UploadState] as UploadedFile)?.validation?.isMatch) {
          validated++;
        }
      }
    });
    
    // Count side uploads
    if (uploads.side && uploads.side.length > 0) {
      uploaded++;
      if (uploads.side.some(s => s.validation.isMatch)) {
        validated++;
      }
    }
    
    return { total, uploaded, validated };
  };

  const stats = getUploadStats();
  const allValidated = stats.validated === 4;
  const hasUploads = stats.uploaded > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center p-1">
              <img src={fordLogo} alt="Ford Logo" className="w-full h-full object-contain" />
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
                  <div className="text-2xl font-bold">{stats.uploaded}/4</div>
                  <div className="text-sm text-primary-foreground/80">Uploaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.validated}/4</div>
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
                  <span>Side view: Complete side profile (left or right side acceptable)</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            viewType="side"
            viewLabel="Side View"
            allowMultiple={true}
            onUpload={(file, validation) => handleUpload('side', file, validation)}
          />
          <CarUploadZone
            viewType="top"
            viewLabel="Top View"
            onUpload={(file, validation) => handleUpload('top', file, validation)}
          />
        </div>

        {/* Validation Summary */}
        {hasUploads && (
          <Card className="p-6 bg-gradient-card shadow-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Validation Summary
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">View Type</TableHead>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected View</TableHead>
                    <TableHead className="w-[100px]">Quality Score</TableHead>
                    <TableHead className="w-[100px] text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(uploads).map(([viewType, upload]) => {
                    if (!upload) return null;
                    
                    const viewLabels = {
                      front: 'Front View',
                      back: 'Back View',
                      side: 'Side View',
                      top: 'Top View'
                    };
                    
                    if (viewType === 'side' && Array.isArray(upload)) {
                      return upload.map((sideUpload, index) => {
                        const qualityScore = sideUpload.validation.quality?.qualityScore ?? 0;
                        const isLowQuality = qualityScore < 70;
                        
                        return (
                          <TableRow key={`${viewType}-${index}`}>
                            <TableCell className="font-medium">
                              {viewLabels[viewType as keyof typeof viewLabels]} #{index + 1}
                            </TableCell>
                            <TableCell>
                              <img
                                src={URL.createObjectURL(sideUpload.file)}
                                alt={`${viewType} view`}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sideUpload.file.name}
                            </TableCell>
                            <TableCell>
                              {sideUpload.validation.isMatch ? (
                                <span className="inline-flex items-center gap-1 text-success font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-destructive font-medium">
                                  <AlertTriangle className="w-4 h-4" />
                                  Invalid
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {sideUpload.validation.isMatch 
                                ? "Correct side view"
                                : sideUpload.validation.detectedView.replace('_', ' ')
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "font-medium",
                                  isLowQuality ? "text-destructive" : "text-success"
                                )}>
                                  {qualityScore}/100
                                </span>
                                {isLowQuality && (
                                  <span className="text-xs text-destructive">
                                    Upload new image
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {Math.round(sideUpload.validation.confidence * 100)}%
                            </TableCell>
                          </TableRow>
                        );
                      });
                    }
                    
                    const singleUpload = upload as UploadedFile;
                    const qualityScore = singleUpload.validation.quality?.qualityScore ?? 0;
                    const isLowQuality = qualityScore < 70;
                    
                    return (
                      <TableRow key={viewType}>
                        <TableCell className="font-medium">
                          {viewLabels[viewType as keyof typeof viewLabels]}
                        </TableCell>
                        <TableCell>
                          <img
                            src={URL.createObjectURL(singleUpload.file)}
                            alt={`${viewType} view`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {singleUpload.file.name}
                        </TableCell>
                        <TableCell>
                          {singleUpload.validation.isMatch ? (
                            <span className="inline-flex items-center gap-1 text-success font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive font-medium">
                              <AlertTriangle className="w-4 h-4" />
                              Invalid
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {singleUpload.validation.isMatch 
                            ? `Correct ${viewType.replace('_', ' ')} view`
                            : singleUpload.validation.detectedView.replace('_', ' ')
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "font-medium",
                              isLowQuality ? "text-destructive" : "text-success"
                            )}>
                              {qualityScore}/100
                            </span>
                            {isLowQuality && (
                              <span className="text-xs text-destructive">
                                Upload new image
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Math.round(singleUpload.validation.confidence * 100)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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