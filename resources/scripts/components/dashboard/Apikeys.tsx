import { useEffect, useState } from "react";
import getApiKeys, { ApiKey } from "@/api/account/getApiKeys";
import createApiKey from "@/api/account/createApiKey";
import deleteApiKey from "@/api/account/deleteApiKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function ManageApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [allowedIps, setAllowedIps] = useState("");
  const [secretToken, setSecretToken] = useState("");
  const { toast } = useToast();

  const loadApiKeys = () => {
    getApiKeys()
      .then((keys) => setApiKeys(keys))
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load API keys",
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleCreate = () => {
    createApiKey(newDescription, allowedIps)
      .then((newKey) => {
        toast({
          title: "Success",
          description: "API Key created successfully",
        });
        setSecretToken(newKey.secretToken);
        setNewDescription("");
        setAllowedIps("");
        loadApiKeys();
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to create API key",
          variant: "destructive",
        });
      });
  };

  const handleDelete = (identifier: string) => {
    deleteApiKey(identifier)
      .then(() => {
        toast({
          title: "Success",
          description: "API Key deleted successfully",
        });
        loadApiKeys();
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to delete API key",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New API Key</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Input
            placeholder="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <Textarea
            placeholder="Allowed IPs (one per line)"
            value={allowedIps}
            onChange={(e) => setAllowedIps(e.target.value)}
          />
          <Button onClick={handleCreate}>Create API Key</Button>
          {secretToken && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <strong>Secret Token:</strong> {secretToken}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p>No API Keys found.</p>
          ) : (
            <ul className="space-y-4">
              {apiKeys.map((key) => (
                <li
                  key={key.identifier}
                  className="border p-4 rounded flex justify-between items-center"
                >
                  <div>
                    <p>
                      <strong>Description:</strong> {key.description}
                    </p>
                    <p>
                      <strong>Allowed IPs:</strong> {key.allowedIps.join(", ")}
                    </p>
                    <p>
                      <strong>Created At:</strong>{" "}
                      {key.createdAt ? key.createdAt.toLocaleString() : "N/A"}
                    </p>
                    <p>
                      <strong>Last Used:</strong>{" "}
                      {key.lastUsedAt ? key.lastUsedAt.toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDelete(key.identifier)}
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}