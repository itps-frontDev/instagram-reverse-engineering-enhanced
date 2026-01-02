"use client";
import React, { useEffect, useState } from "react";
import MessageList, { MessageItem } from "@/components/direct/MessageList";
import MessageInput from "@/components/direct/MessageInput";
import { useAuth } from "@/contexts/AuthContext";
import ChatContactList, { ChatContact } from "@/components/direct/ChatContactList";

export default function DirectPage() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined); // ID della chat vera
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Carica i follower come contatti, creando chat on-demand
  useEffect(() => {
    async function fetchFollowers() {
      try {
        const res = await fetch("/api/profiles/me/followers");
        if (!res.ok) return;
        const data = await res.json();
        const followers = (data.followers || []) as any[];
        
        // Mappa i follower come contatti
        const mapped: ChatContact[] = followers.map((f) => ({
          id: f.id, // ID del profilo follower, usato per creare chat
          name: f.full_name || f.username,
          profile_image_url: f.profile_image_url,
        }));
        setContacts(mapped);
        if (mapped.length > 0) {
          // Al click su un contatto, verrà creata la chat
          setSelectedId(mapped[0].id);
        }
      } catch (e) {
        console.error('[DirectPage] Error fetching followers:', e);
      }
    }
    fetchFollowers();
  }, []);

  // Quando viene selezionato un contatto (profilo), crea o ottiene la chat
  useEffect(() => {
    if (!selectedId) return;
    
    (async () => {
      try {
        const res = await fetch("/api/direct/get-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherProfileId: selectedId }),
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedChatId(data.chatId);
        }
      } catch (e) {
        console.error('[DirectPage] Error getting or creating chat:', e);
      }
    })();
  }, [selectedId]);

  // Carica i messaggi della chat selezionata e poll ogni 2 secondi
  useEffect(() => {
    if (!selectedChatId) return;

    // Carica immediatamente
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/direct/messages?chatId=${selectedChatId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (e) {
        console.error('[DirectPage] Error fetching messages:', e);
      }
    };

    setLoadingMessages(true);
    fetchMessages().finally(() => setLoadingMessages(false));

    // Poll ogni 2 secondi per nuovi messaggi
    const interval = setInterval(fetchMessages, 2000);

    return () => clearInterval(interval);
  }, [selectedChatId]);

  const handleSend = async (text: string) => {
    if (!selectedChatId) return;
    setSending(true);
    try {
      const res = await fetch("/api/direct/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChatId, text }),
      });
      if (res.ok) {
        // Ricarica i messaggi dopo l'invio
        const data = await fetch(`/api/direct/messages?chatId=${selectedChatId}`).then((r) => r.json());
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('[DirectPage] Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  // Layout: Sidebar collassata, colonna chat, colonna messaggi
  // Usiamo -ml per compensare il margin aggiunto dal layout principale
  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#000000] -ml-[80px] xl:-ml-[336px]">
      {/* Container principale */}
      <div className="flex flex-1 h-full ml-[80px]">
        {/* Colonna chat - senza storie */}
        <div className="w-[400px] border-r border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#000000] h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E5] dark:border-[#262626]">
            <h2 className="text-lg font-semibold text-[#262626] dark:text-white">Messaggi</h2>
          </div>
          {/* Lista contatti */}
          <div className="flex-1 overflow-y-auto">
            <ChatContactList contacts={contacts} onSelect={setSelectedId} selectedId={selectedId} />
          </div>
        </div>
        {/* Colonna messaggi espansa */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#000000] min-w-0">
        {selectedId ? (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center text-[#A8A8A8]">Caricamento...</div>
              ) : (
                <MessageList messages={messages} currentProfileId={profile?.id || 0} />
              )}
            </div>
            <MessageInput onSend={handleSend} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#A8A8A8]">Seleziona una chat</div>
        )}
        </div>
      </div>
    </div>
  );
}
