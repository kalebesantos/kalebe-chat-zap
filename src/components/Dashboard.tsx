
import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, MessageSquare, Settings, Brain } from 'lucide-react';
import UsersTable from '@/components/UsersTable';
import MessagesView from '@/components/MessagesView';
import ActiveConversationsManager from '@/components/ActiveConversationsManager';
import StyleLearningManager from '@/components/StyleLearningManager';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  session: Session;
}

const Dashboard = ({ session }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('users');
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Painel Bot WhatsApp
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento do Bot
          </h2>
          <p className="text-gray-600">
            Gerencie usuários, conversas ativas, aprendizado de estilo e visualize mensagens do bot de WhatsApp
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Conversas Ativas
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Estilo IA
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os usuários que interagiram com o bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-6">
            <ActiveConversationsManager />
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <StyleLearningManager />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Mensagens</CardTitle>
                <CardDescription>
                  Visualize as conversas entre usuários e o bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MessagesView />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
