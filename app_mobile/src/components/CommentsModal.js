import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API, { getServerURL } from '../api/backend';
import { AuthContext } from '../context/AuthContext';

export default function CommentsModal({ visible, onClose, postId, onCommentCountChange }) {
    const { user } = useContext(AuthContext);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState([]);

    useEffect(() => {
        if (visible && postId) {
            loadComments();
            
            // Polling cada 5 segundos cuando el modal está abierto
            const pollingInterval = setInterval(() => {
                if (visible && postId) {
                    loadCommentsSilently();
                }
            }, 3000);

            return () => clearInterval(pollingInterval);
        }
    }, [visible, postId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/community/posts/${postId}/comments`);
            setComments(res.data.comments || []);
        } catch (error) {
            // Error silencioso
        } finally {
            setLoading(false);
        }
    };

    const loadCommentsSilently = async () => {
        try {
            const res = await API.get(`/community/posts/${postId}/comments`);
            if (res.data.comments) {
                setComments(prevComments => {
                    // Mantener comentarios locales recientes
                    const newComments = res.data.comments;
                    const localOnlyComments = prevComments.filter(c => 
                        !newComments.find(nc => nc._id === c._id) &&
                        (Date.now() - new Date(c.created_at).getTime()) < 3000
                    );
                    return [...newComments, ...localOnlyComments];
                });
            }
        } catch (error) {
            // Silencioso
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await API.post(`/community/posts/${postId}/comments`, {
                content: newComment.trim(),
            });
            
            // Agregar comentario en tiempo real
            if (res.data.comment) {
                setComments(prevComments => [...prevComments, res.data.comment]);
                
                // Notificar al padre para actualizar contador
                if (onCommentCountChange) {
                    onCommentCountChange(postId, 'add');
                }
                
                Toast.show({
                    type: 'success',
                    text1: '💬 Comentario publicado',
                    text2: 'Tu comentario se agregó correctamente'
                });
            }
            
            setNewComment('');
            setShowUserSuggestions(false);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo publicar el comentario'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const searchUsers = async (query) => {
        if (!query || query.length < 1) {
            setUserSuggestions([]);
            return;
        }

        try {
            const res = await API.get(`/auth/search-users?q=${encodeURIComponent(query)}`);
            setUserSuggestions(res.data.users || []);
        } catch (error) {
            setUserSuggestions([]);
        }
    };

    const handleCommentTextChange = (text) => {
        setNewComment(text);

        const atIndex = text.lastIndexOf('@');
        if (atIndex !== -1) {
            const afterAt = text.substring(atIndex + 1);
            if (!afterAt.includes(' ')) {
                setShowUserSuggestions(true);
                searchUsers(afterAt);
            } else {
                setShowUserSuggestions(false);
            }
        } else {
            setShowUserSuggestions(false);
        }
    };

    const selectUser = (username) => {
        const atIndex = newComment.lastIndexOf('@');
        const beforeAt = newComment.substring(0, atIndex);
        setNewComment(`${beforeAt}@${username} `);
        setShowUserSuggestions(false);
        setUserSuggestions([]);
    };

    const renderTextWithMentions = (text) => {
        const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index),
                    key: `text-${lastIndex}`,
                });
            }

            parts.push({
                type: 'mention',
                content: match[0],
                username: match[1],
                key: `mention-${match.index}`,
            });

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex),
                key: `text-${lastIndex}`,
            });
        }

        return (
            <Text style={styles.commentText}>
                {parts.map((part) => {
                    if (part.type === 'mention') {
                        return (
                            <Text key={part.key} style={styles.mentionText}>
                                {part.content}
                            </Text>
                        );
                    }
                    return <Text key={part.key}>{part.content}</Text>;
                })}
            </Text>
        );
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment);
        setEditCommentContent(comment.content);
    };

    const handleUpdateComment = async () => {
        if (!editCommentContent.trim() || !editingComment) return;

        try {
            await API.put(`/community/comments/${editingComment._id}`, {
                content: editCommentContent.trim()
            });
            
            // Actualizar comentario en tiempo real
            setComments(prevComments => prevComments.map(comment => {
                if (comment._id === editingComment._id) {
                    return {
                        ...comment,
                        content: editCommentContent.trim(),
                        updated_at: new Date().toISOString()
                    };
                }
                return comment;
            }));
            
            Toast.show({
                type: 'success',
                text1: '✅ Comentario actualizado',
                text2: 'Tus cambios se guardaron'
            });
            
            setEditingComment(null);
            setEditCommentContent('');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo actualizar el comentario'
            });
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await API.delete(`/community/comments/${commentId}`);
            setComments(prevComments => prevComments.filter(c => c._id !== commentId));
            
            // Notificar al padre para actualizar contador
            if (onCommentCountChange) {
                onCommentCountChange(postId, 'delete');
            }
            
            Toast.show({
                type: 'success',
                text1: 'Comentario eliminado'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar el comentario'
            });
        }
    };

    const showCommentOptions = (comment) => {
        Alert.alert(
            'Opciones',
            null,
            [
                {
                    text: 'Editar',
                    onPress: () => handleEditComment(comment)
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => handleDeleteComment(comment._id)
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                }
            ]
        );
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'ahora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h`;
        const days = Math.floor(hours / 24);
        return `${days} d`;
    };

    const renderComment = ({ item }) => {
        const userId = user?._id || user?.id;
        const authorId = item.author?._id || item.author?.id;
        const isOwnComment = userId && authorId && userId === authorId;
        const authorPhoto = item.author?.photo;
        const hasPhoto = authorPhoto && !authorPhoto.includes('default-avatar');
        
        // Construir URL completa para la imagen
        const baseUrl = hasPhoto && authorPhoto.startsWith('/') 
            ? `${getServerURL()}${authorPhoto}`
            : authorPhoto;
        const imageUrl = hasPhoto && authorId ? `${baseUrl}?uid=${authorId}` : baseUrl;
        
        return (
        <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
                {hasPhoto ? (
                    <View style={styles.commentAvatar}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                            resizeMode="cover"
                        />
                    </View>
                ) : (
                    <View style={styles.commentAvatar}>
                        <Ionicons name="person" size={20} color="#667EEA" />
                    </View>
                )}
                <View style={styles.commentHeaderText}>
                    <Text style={styles.commentAuthor}>
                        {item.author?.name || 'Usuario'}
                    </Text>
                    <Text style={styles.commentTime}>{getTimeAgo(item.created_at)}</Text>
                </View>
                {isOwnComment && (
                    <TouchableOpacity
                        onPress={() => showCommentOptions(item)}
                        style={styles.commentOptionsButton}
                    >
                        <Ionicons name="ellipsis-horizontal" size={18} color="#666" />
                    </TouchableOpacity>
                )}
            </View>
            {renderTextWithMentions(item.content)}
        </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            transparent={false}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Comentarios</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Comments List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#667EEA" />
                    </View>
                ) : (
                    <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.commentsList}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>
                                    Aún no hay comentarios
                                </Text>
                                <Text style={styles.emptySubtext}>
                                    Sé el primero en comentar
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Edit Comment Modal */}
                {editingComment && (
                    <Modal
                        visible={!!editingComment}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setEditingComment(null)}
                    >
                        <View style={styles.editModalOverlay}>
                            <View style={styles.editModalContent}>
                                <View style={styles.editModalHeader}>
                                    <Text style={styles.editModalTitle}>Editar comentario</Text>
                                    <TouchableOpacity onPress={() => setEditingComment(null)}>
                                        <Ionicons name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.editModalInput}
                                    value={editCommentContent}
                                    onChangeText={setEditCommentContent}
                                    multiline={true}
                                    autoFocus={true}
                                />
                                <View style={styles.editModalActions}>
                                    <TouchableOpacity
                                        style={styles.editModalCancelButton}
                                        onPress={() => setEditingComment(null)}
                                    >
                                        <Text style={styles.editModalCancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.editModalSaveButton,
                                            !editCommentContent.trim() && styles.editModalSaveButtonDisabled
                                        ]}
                                        onPress={handleUpdateComment}
                                        disabled={!editCommentContent.trim()}
                                    >
                                        <Text style={styles.editModalSaveText}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}

                {/* User Suggestions */}
                {showUserSuggestions && userSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <FlatList
                            data={userSuggestions}
                            keyExtractor={(item) => item._id}
                            horizontal
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => selectUser(item.email.split('@')[0])}
                                >
                                    <View style={styles.suggestionAvatar}>
                                        {item.profilePhoto ? (
                                            <Image
                                                source={{ uri: `${getServerURL()}${item.profilePhoto}?uid=${item._id}` }}
                                                style={styles.suggestionAvatarImage}
                                            />
                                        ) : (
                                            <Ionicons name="person" size={16} color="#4A90E2" />
                                        )}
                                    </View>
                                    <Text style={styles.suggestionName} numberOfLines={1}>
                                        {item.firstName}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Add Comment Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe un comentario... (usa @)"
                        value={newComment}
                        onChangeText={handleCommentTextChange}
                        multiline={true}
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!newComment.trim() || submitting) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleAddComment}
                        disabled={!newComment.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    closeButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentsList: {
        padding: 16,
    },
    commentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    commentAvatarImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    commentHeaderText: {
        flex: 1,
    },
    commentOptionsButton: {
        padding: 4,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    commentTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    mentionText: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        maxHeight: 80,
    },
    suggestionItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 60,
    },
    suggestionAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    suggestionAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    suggestionName: {
        fontSize: 11,
        color: '#333',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 8,
    },
    inputContainer: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: '#667EEA',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    editModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    editModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    editModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editModalInput: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    editModalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    editModalCancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginRight: 12,
    },
    editModalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    editModalSaveButton: {
        backgroundColor: '#667EEA',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    editModalSaveButtonDisabled: {
        opacity: 0.5,
    },
    editModalSaveText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
