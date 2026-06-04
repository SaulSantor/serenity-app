import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Modal,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API, { getServerURL } from '../../api/backend';
import CommentsModal from '../../components/CommentsModal';
import { AuthContext } from '../../context/AuthContext';

export default function CommunityScreen() {
    const { user } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [editPostContent, setEditPostContent] = useState('');
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [hasNewPosts, setHasNewPosts] = useState(false);

    useEffect(() => {
        loadPosts();
        
        // Polling automático cada 10 segundos
        const pollingInterval = setInterval(() => {
            loadPostsSilently();
        }, 5000);

        return () => clearInterval(pollingInterval);
    }, []);

    const loadPosts = async () => {
        try {
            const res = await API.get('/community/posts?limit=20&offset=0');
            setPosts(res.data.posts || []);
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };

    const loadPostsSilently = async () => {
        try {
            const res = await API.get('/community/posts?limit=20&offset=0');
            if (res.data.posts) {
                setPosts(prevPosts => {
                    const newPosts = res.data.posts;
                    
                    // Detectar si hay posts nuevos
                    if (prevPosts.length > 0 && newPosts.length > 0) {
                        const hasNew = newPosts[0]._id !== prevPosts[0]._id;
                        if (hasNew) {
                            setHasNewPosts(true);
                        }
                    }
                    
                    // Merge inteligente: mantener orden del servidor pero preservar optimistic updates
                    return newPosts.map(serverPost => {
                        const localPost = prevPosts.find(p => p._id === serverPost._id);
                        
                        // Si el usuario acaba de dar like (optimistic update), mantener estado local por 2s
                        if (localPost && localPost.user_liked !== serverPost.user_liked) {
                            const timeSinceCreation = Date.now() - new Date(localPost.created_at || serverPost.created_at).getTime();
                            if (timeSinceCreation < 2000) {
                                return localPost;
                            }
                        }
                        
                        return serverPost;
                    });
                });
            }
        } catch (error) {
            // Silencioso, no mostrar error
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setHasNewPosts(false);
        await loadPosts();
        setRefreshing(false);
    };

    const loadNewPosts = async () => {
        setHasNewPosts(false);
        await loadPosts();
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
            console.error('Error searching users:', error);
            setUserSuggestions([]);
        }
    };

    const handlePostTextChange = (text) => {
        setNewPost(text);

        // Detect @ mention
        const atIndex = text.lastIndexOf('@');
        if (atIndex !== -1) {
            const afterAt = text.substring(atIndex + 1);
            // Check if there's a space after @ (which would end the mention)
            if (!afterAt.includes(' ')) {
                setMentionQuery(afterAt);
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
        const atIndex = newPost.lastIndexOf('@');
        const beforeAt = newPost.substring(0, atIndex);
        setNewPost(`${beforeAt}@${username} `);
        setShowUserSuggestions(false);
        setUserSuggestions([]);
    };

    const handleCreatePost = async () => {
        if (!newPost.trim()) return;

        try {
            const res = await API.post('/community/posts', { content: newPost });
            
            // Agregar nuevo post al inicio de la lista en tiempo real
            if (res.data.post) {
                setPosts(prevPosts => [res.data.post, ...prevPosts]);
                Toast.show({
                    type: 'success',
                    text1: '📝 Publicación creada',
                    text2: 'Tu post se compartió con la comunidad'
                });
            }
            
            setNewPost('');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo crear el post'
            });
        }
    };

    const handleLike = async (postId, isLiked) => {
        try {
            // Actualizar UI inmediatamente (optimistic update)
            setPosts(prevPosts => prevPosts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        user_liked: !isLiked,
                        likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
                    };
                }
                return post;
            }));

            // Hacer la petición al servidor
            if (isLiked) {
                await API.post(`/community/posts/${postId}/unlike`);
            } else {
                await API.post(`/community/posts/${postId}/like`);
            }
        } catch (error) {
            // Revertir cambio si falla
            setPosts(prevPosts => prevPosts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        user_liked: isLiked,
                        likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1
                    };
                }
                return post;
            }));
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setEditPostContent(post.content);
    };

    const handleUpdatePost = async () => {
        if (!editPostContent.trim()) return;

        try {
            await API.put(`/community/posts/${editingPost._id}`, {
                content: editPostContent.trim()
            });
            
            // Actualizar post en tiempo real
            setPosts(prevPosts => prevPosts.map(post => {
                if (post._id === editingPost._id) {
                    return {
                        ...post,
                        content: editPostContent.trim(),
                        updated_at: new Date().toISOString()
                    };
                }
                return post;
            }));
            
            Toast.show({
                type: 'success',
                text1: '✅ Post actualizado',
                text2: 'Tus cambios se guardaron correctamente'
            });
            
            setEditingPost(null);
            setEditPostContent('');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo actualizar el post'
            });
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await API.delete(`/community/posts/${postId}`);
            setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
            Toast.show({
                type: 'success',
                text1: 'Publicación eliminada'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar el post'
            });
        }
    };

    const showPostOptions = (post) => {
        handleEditPost(post);
    };

    const renderPost = ({ item }) => {
        const userId = user?._id || user?.id;
        const authorId = item.author?._id || item.author?.id;
        const isOwnPost = userId && authorId && userId === authorId;
        const authorPhoto = item.author?.photo;
        const hasPhoto = authorPhoto && !authorPhoto.includes('default-avatar');
        
        // Construir URL completa para la imagen
        // Usar author.id como cache key en vez de Date.now() para evitar problemas con concurrencia
        const baseUrl = hasPhoto && authorPhoto.startsWith('/')
            ? `${getServerURL()}${authorPhoto}`
            : authorPhoto;
        const imageUrl = hasPhoto && authorId ? `${baseUrl}?uid=${authorId}` : baseUrl;
        
        return (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                    {hasPhoto ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.avatarImage}
                            key={`avatar-${authorId}`}
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={24} color="#7BB6E8" />
                        </View>
                    )}
                    <View>
                        <Text style={styles.authorName}>{item.author?.name || 'Usuario'}</Text>
                        <Text style={styles.postTime}>Hace {getTimeAgo(item.created_at)}</Text>
                    </View>
                </View>
                {isOwnPost && (
                    <TouchableOpacity
                        onPress={() => showPostOptions(item)}
                        style={styles.optionsButton}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {renderTextWithMentions(item.content)}

            <View style={styles.postActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleLike(item._id, item.user_liked)}
                >
                    <Ionicons
                        name={item.user_liked ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.user_liked ? '#FF6B6B' : '#666'}
                    />
                    <Text style={styles.actionText}>{item.likes_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        setSelectedPostId(item._id);
                        setCommentsModalVisible(true);
                    }}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
        );
    };

    const renderTextWithMentions = (text) => {
        const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index),
                    key: `text-${lastIndex}`,
                });
            }

            // Add mention
            parts.push({
                type: 'mention',
                content: match[0],
                username: match[1],
                key: `mention-${match.index}`,
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex),
                key: `text-${lastIndex}`,
            });
        }

        return (
            <Text style={styles.postContent}>
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

    const handleCommentCountChange = (postId, action) => {
        setPosts(prevPosts => prevPosts.map(post => {
            if (post._id === postId) {
                const currentCount = post.comments_count || 0;
                return {
                    ...post,
                    comments_count: action === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1)
                };
            }
            return post;
        }));
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'un momento';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h`;
        const days = Math.floor(hours / 24);
        return `${days} d`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Comunidad</Text>
            </View>

            {/* Indicador de nuevos posts */}
            {hasNewPosts && (
                <TouchableOpacity 
                    style={styles.newPostsBanner}
                    onPress={loadNewPosts}
                >
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.newPostsText}>Nuevas publicaciones disponibles</Text>
                </TouchableOpacity>
            )}

            {/* Create Post */}
            <View style={styles.createPostContainer}>
                <TextInput
                    style={styles.createPostInput}
                    placeholder="Comparte tu experiencia... (usa @ para mencionar)"
                    value={newPost}
                    onChangeText={handlePostTextChange}
                    multiline={true}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !newPost.trim() && styles.sendButtonDisabled]}
                    onPress={handleCreatePost}
                    disabled={!newPost.trim()}
                >
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* User Suggestions Dropdown */}
            {showUserSuggestions && userSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={userSuggestions}
                        keyExtractor={(item) => item._id}
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
                                        <Ionicons name="person" size={20} color="#4A90E2" />
                                    )}
                                </View>
                                <View style={styles.suggestionInfo}>
                                    <Text style={styles.suggestionName}>
                                        {item.firstName} {item.lastName}
                                    </Text>
                                    <Text style={styles.suggestionUsername}>
                                        @{item.email.split('@')[0]}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Aún no hay publicaciones</Text>
                        <Text style={styles.emptySubtext}>Sé el primero en compartir</Text>
                    </View>
                }
            />

            {/* Edit Post Modal */}
            <Modal
                visible={!!editingPost}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditingPost(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar publicación</Text>
                            <TouchableOpacity onPress={() => setEditingPost(null)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            value={editPostContent}
                            onChangeText={setEditPostContent}
                            multiline={true}
                            autoFocus={true}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setEditingPost(null)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalSaveButton,
                                    !editPostContent.trim() && styles.modalSaveButtonDisabled
                                ]}
                                onPress={handleUpdatePost}
                                disabled={!editPostContent.trim()}
                            >
                                <Text style={styles.modalSaveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <CommentsModal
                visible={commentsModalVisible}
                onClose={() => setCommentsModalVisible(false)}
                postId={selectedPostId}
                onCommentCountChange={handleCommentCountChange}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    newPostsBanner: {
        backgroundColor: '#4A90E2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
    },
    newPostsText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    createPostContainer: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    createPostInput: {
        flex: 1,
        backgroundColor: '#F3F6F8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#7BB6E8',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    list: {
        padding: 16,
    },
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    postTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    postContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 12,
    },
    mentionText: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: -8,
        marginBottom: 8,
        borderRadius: 12,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionAvatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    suggestionInfo: {
        flex: 1,
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    suggestionUsername: {
        fontSize: 12,
        color: '#4A90E2',
        marginTop: 2,
    },
    optionsButton: {
        padding: 4,
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalInput: {
        backgroundColor: '#F3F6F8',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalCancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginRight: 12,
    },
    modalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    modalSaveButton: {
        backgroundColor: '#7BB6E8',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    modalSaveButtonDisabled: {
        opacity: 0.5,
    },
    modalSaveText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 8,
    },
});
