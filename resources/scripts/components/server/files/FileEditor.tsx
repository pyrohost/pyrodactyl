import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import LogoLoader from '@/components/elements/ServerLoad';
import CustomTerminal from '../console/Console';

interface FileEditorProps {
    serverId: string;
    file: string;
}


const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'php': 'php',
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'md': 'markdown',
    'txt': 'plaintext'
};

const uniqueLanguages = Array.from(new Set(Object.values(languageMap))).sort();

const detectLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return languageMap[ext] || 'plaintext';
};

export default function FileEditor({ serverId, file }: FileEditorProps) {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState(() => detectLanguage(file));

    useEffect(() => {
        loadFileContent();
    }, [file]);

    const loadFileContent = async () => {
        try {
            setLoading(true);
            const content = await getFileContents(serverId, file);
            setContent(content);
        } catch (error) {
            setError('Failed to load file content');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await saveFileContents(serverId, file, content);
            router.visit(`?dir=${file.split('/').slice(0, -1).join('/')}`);
        } catch (error) {
            setError('Failed to save file');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        router.visit(`?dir=${file.split('/').slice(0, -1).join('/')}`);
    };

    if (loading) {
        return (
            <div className="items-center justify-center flex h-full w-full">
                <LogoLoader size="160px"/>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-4 mt-6">
                <div className="text-red-500">{error}</div>
            </Card>
        );
    }

    return (
        <>
        <Card className="flex flex-col h-[80vh] mt-4">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Editing: root{file}</h2>
                <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueLanguages.map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </div>
            </div>
            <div className="flex-1 mb-3">
            <Editor
                    height="100%"
                    defaultLanguage={language}
                    language={language}
                    value={content}
                    onChange={(value) => setContent(value || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on'
                    }}
                />
            </div>
        </Card>
        
        <div>
            <h1 className='py-4 text-lg'>Debug Terminal </h1>
            <CustomTerminal/>
        </div>
        </>
        
    );
}