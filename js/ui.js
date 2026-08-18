/* ============================================================
   Medieval Map Editor — ui.js  v3
   Paneller, i18n (TR/EN), katman listesi, sembol kütüphanesi,
   etiket şablonları, ölçek çubuğu, klavye.
   ============================================================ */
(function (global) {
  'use strict';

  var DICT = {
    tr: {
      new:'Yeni', open:'Aç', save:'Kaydet', parchment:'Parşömen', grid:'Izgara', shore:'Kıyı',
      t_select:'Seç', t_landmass:'Kara', t_erase:'Deniz', t_terrain:'Arazi', t_symbol:'Sembol',
      t_river:'Nehir', t_road:'Yol', t_label:'Etiket', t_pan:'Kaydır', t_eyedrop:'Örnekle',
      o_landmass:'Kara / Kıyı', o_brushsize:'Fırça boyutu', o_rough:'Kıyı sertliği',
      o_landcolor:'Kara rengi', o_shorew:'Kıyı genişliği', o_shorestyle:'Kıyı stili', o_shore_sandy:'Kumsal', o_shore_rocky:'Kayalık', o_shore_reef:'Resif',
      o_smooth:'Kıyıyı yumuşat', o_clearland:'Karayı temizle',
      h_landmass:'Sürükleyerek kara çiz. "Deniz" aracı hem karayı hem araziyi siler.',
      o_terrain:'Arazi boyama', o_opacity:'Opaklık', o_clip:'Sadece karaya boya',
      o_clearterrain:'Arazi katmanını temizle',
      h_terrain:'Doku her fırça vuruşunda rastgele serpilir — tekrar eden örüntü oluşmaz.', t_elevation:'Yükselti', o_elevation:'Yükselti', o_elevstrength:'Şiddet', o_elevlower:'Alçaltma modu', o_clearelevation:'Yükseltiyi temizle', o_elevdisplay:'Görünüm', o_elevhillshade:'Gölgelendirme (hillshade)', o_elevcontours:'Kontur çizgileri', o_contourinterval:'Kontur aralığı', h_elevation:'Sürükleyerek yükselt; "Alçaltma modu" işaretliyken çukurlaştırır. Gölgelendirme haritayı otomatik günceller.',
      o_symbol:'Sembol', o_size:'Boyut', o_rot:'Dönüş', o_hue:'Renk tonu',
      o_wear:'Yıpranma', o_jitter:'Yerleştirmede rastgelelik',
      h_symbol:'Kütüphaneden sembol seç, haritaya tıkla. "Seç" aracıyla taşı; Delete ile sil.',
      o_river:'Nehir', o_width:'Kalınlık', o_meander:'Kıvrım',
      o_taper:'Kaynakta incelt', o_color:'Renk',
      h_path:'Tıklayarak nokta ekle. Enter / çift tık ile bitir, Esc ile iptal.',
      o_road:'Yol / Kervan güzergâhı',
      o_label:'Etiket', o_preset:'Stil şablonu', o_curve:'Eğim', o_track:'Harf aralığı',
      h_label:'Şablon seç, metni yaz, haritaya tıkla. Seçili etikette ayarlar anında uygulanır.',
      o_eyedrop:'Doku Örnekleyici', o_eye_nosample:'Henüz örnekleme yapılmadı',
      o_eye_radius:'Örnekleme yarıçapı', o_eye_brush:'Fırça boyutu',
      o_eye_pick:'① Alan seç', o_eye_paint:'② Boyamaya başla', o_eye_clear:'Örneği temizle',
      h_eyedrop:'① Alan seç: sürükleyerek daire çiz. ② Boyamaya başla: dokuyu haritaya uygula.',
      eyeOk:'✓ Doku örneklendi', eyeFail:'Örnekleme başarısız — kara/arazi üstünde dene.',
      eyePick:'Haritada tıklayıp sürükle → daire boyutunu seç → bırak.',
      eyePaint:'Haritaya tıklayıp sürükle → doku uygulanır.',
      eyeNeed:'Önce ① Alan seç ile doku örnekle.',
      o_selection:'Seçim', o_nosel:'Seçili nesne yok', o_dup:'Çoğalt', o_del:'Sil',
      o_scalebar:'Ölçek çubuğu', o_scvis:'Haritada göster', o_sclen:'Uzunluk',
      o_scsize:'Yazı boyutu', o_scsegs:'Bölme sayısı',
      h_scale:'Ölçek çubuğunu haritada sürükleyerek taşıyabilirsin.',
      o_view:'Görünüm', o_fit:'Ekrana sığdır', o_100:'%100',
      h_pan:'Sağ tık + sürükle, orta tık, Space + sürükle veya yön tuşları ile kaydır.',
      tab_layers:'Katmanlar', tab_library:'Kütüphane', tab_history:'Geçmiş',
      ref_title:'Referans görsel', ref_export:"Export'a dahil et", ref_clear:'Referansı kaldır',
      sym_upload:'+ PNG Sembol yükle', sym_upload_done:'sembol yüklendi', sym_del:'Sil', sym_search:'Sembol ara...',
      st_pos:'Konum', st_zoom:'Yakınlık', st_size:'Tuval', st_tool:'Araç',
      cancel:'Vazgeç', ok:'Tamam',
      locked:'Katman kilitli veya gizli.', needtext:'Önce etiket metnini yaz.',
      exported:'Dışa aktarıldı:', saved:'Proje kaydedildi.', loaded:'Proje yüklendi.',
      badfile:'Geçersiz proje dosyası.', newmap:'Yeni harita oluşturuldu.',
      confirmNew:'Mevcut harita silinecek. Yeni tuval boyutunu seç:',
      confirmSize:'Tuval boyutunu değiştirmek mevcut katmanları ölçekler. Devam edilsin mi?',
      histStart:'Başlangıç', selNone:'Seçili nesne yok', symbols:'sembol',
      selScale:'Ölçek çubuğu seçili',
      o_zorder:'Sıralama', o_front:'En öne', o_back:'En arkaya',
      o_fwd:'Öne getir', o_bwd:'Arkaya gönder',
      o_group:'Grupla', o_ungroup:'Grubu çöz',
      selMulti:'nesne seçili',
      t_lake:'Göl', o_lake:'Göl', h_lake:'Tıklayarak nokta ekle, 3+ nokta sonra Enter ile kapat.', t_territory:'Bölge', o_territory:'Bölge', o_territorycolor:'Dolgu rengi', o_territorybcolor:'Sınır rengi', h_territory:'Tıklayarak nokta ekle, 3+ nokta sonra Enter ile kapat.',
      o_lakecolor:'Göl rengi',
      o_symbbrush:'Fırça modu', o_symbdensity:'Yoğunluk', o_clipland:'Karaya kenetle (fırça)',
      o_windrose:'Pusula Gülü', o_wrvis:'Haritada göster', o_wrsize:'Boyut',
      o_wrstyle_classic:'Klasik', o_wrstyle_minimal:'Sade', o_wrstyle:'Stil', o_wrcolor:'Renk', h_windrose:'Haritada sürükleyerek taşı.',
      o_snap:'Izgaraya yapış', o_snapsize:'Izgara boyutu',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    en: {
      new:'New', open:'Open', save:'Save', parchment:'Parchment', grid:'Grid', shore:'Shore',
      t_select:'Select', t_landmass:'Land', t_erase:'Sea', t_terrain:'Terrain', t_symbol:'Symbol',
      t_river:'River', t_road:'Road', t_label:'Label', t_pan:'Pan', t_eyedrop:'Sample',
      o_landmass:'Landmass / Coast', o_brushsize:'Brush size', o_rough:'Coast roughness',
      o_landcolor:'Land colour', o_shorew:'Shore width', o_shorestyle:'Shore style', o_shore_sandy:'Sandy', o_shore_rocky:'Rocky', o_shore_reef:'Reef',
      o_smooth:'Smooth coastline', o_clearland:'Clear landmass',
      h_landmass:'Drag to paint land. The "Sea" tool erases both land and terrain.',
      o_terrain:'Terrain painting', o_opacity:'Opacity', o_clip:'Paint on land only',
      o_clearterrain:'Clear terrain layer',
      h_terrain:'Marks scatter randomly on every stroke — no repeating pattern.', t_elevation:'Elevation', o_elevation:'Elevation', o_elevstrength:'Strength', o_elevlower:'Lower mode', o_clearelevation:'Clear elevation', o_elevdisplay:'Display', o_elevhillshade:'Hillshade', o_elevcontours:'Contour lines', o_contourinterval:'Contour interval', h_elevation:'Drag to raise terrain; enable "Lower mode" to carve it down. Hillshade updates the map automatically.',
      o_symbol:'Symbol', o_size:'Size', o_rot:'Rotation', o_hue:'Hue shift',
      o_wear:'Wear', o_jitter:'Randomise placement',
      h_symbol:'Pick a symbol, click the map. Use "Select" to move; Delete to remove.',
      o_river:'River', o_width:'Width', o_meander:'Meander',
      o_taper:'Taper at source', o_color:'Colour',
      h_path:'Click to add points. Enter / double-click to finish, Esc to cancel.',
      o_road:'Road / Caravan route',
      o_label:'Label', o_preset:'Style preset', o_curve:'Curve', o_track:'Letter spacing',
      h_label:'Pick a preset, type the text, click the map. Live-applies to a selected label.',
      o_eyedrop:'Texture Sampler', o_eye_nosample:'No sample yet',
      o_eye_radius:'Sample radius', o_eye_brush:'Brush size',
      o_eye_pick:'① Pick area', o_eye_paint:'② Start painting', o_eye_clear:'Clear sample',
      h_eyedrop:'① Pick area: drag a circle. ② Paint: apply the sampled texture.',
      eyeOk:'✓ Texture sampled', eyeFail:'Sampling failed — try over land/terrain.',
      eyePick:'Click and drag on the map → set circle size → release.',
      eyePaint:'Click and drag on the map → texture is applied.',
      eyeNeed:'Sample a texture with ① Pick area first.',
      o_selection:'Selection', o_nosel:'Nothing selected', o_dup:'Duplicate', o_del:'Delete',
      o_scalebar:'Scale bar', o_scvis:'Show on map', o_sclen:'Length',
      o_scsize:'Text size', o_scsegs:'Segments',
      h_scale:'Drag the scale bar on the map to reposition it.',
      o_view:'View', o_fit:'Fit to screen', o_100:'100%',
      h_pan:'Right-click drag, middle-click, Space + drag, or arrow keys to pan.',
      tab_layers:'Layers', tab_library:'Library', tab_history:'History',
      ref_title:'Reference image', ref_export:'Include in export', ref_clear:'Remove reference',
      sym_upload:'+ Upload PNG Symbol', sym_upload_done:'symbol(s) loaded', sym_del:'Delete', sym_search:'Search symbols...',
      st_pos:'Pos', st_zoom:'Zoom', st_size:'Canvas', st_tool:'Tool',
      cancel:'Cancel', ok:'OK',
      locked:'Layer is locked or hidden.', needtext:'Type the label text first.',
      exported:'Exported:', saved:'Project saved.', loaded:'Project loaded.',
      badfile:'Invalid project file.', newmap:'New map created.',
      confirmNew:'The current map will be discarded. Choose a canvas size:',
      confirmSize:'Changing canvas size rescales existing layers. Continue?',
      histStart:'Start', selNone:'Nothing selected', symbols:'symbols',
      selScale:'Scale bar selected',
      o_zorder:'Z-Order', o_front:'Bring to front', o_back:'Send to back',
      o_fwd:'Bring forward', o_bwd:'Send backward',
      o_group:'Group', o_ungroup:'Ungroup',
      selMulti:'objects selected',
      t_lake:'Lake', o_lake:'Lake', h_lake:'Click to add points, 3+ points then Enter to close.', t_territory:'Territory', o_territory:'Territory', o_territorycolor:'Fill colour', o_territorybcolor:'Border colour', h_territory:'Click to add points, 3+ points then Enter to close.',
      o_lakecolor:'Lake colour',
      o_symbbrush:'Brush mode', o_symbdensity:'Density', o_clipland:'Clip to land (brush)',
      o_windrose:'Windrose', o_wrvis:'Show on map', o_wrsize:'Size',
      o_wrstyle_classic:'Classic', o_wrstyle_minimal:'Minimal', o_wrstyle:'Style', o_wrcolor:'Colour', h_windrose:'Drag on the map to reposition.',
      o_snap:'Snap to grid', o_snapsize:'Grid size',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    de: {
      new:'Neu', open:'Öffnen', save:'Speichern', parchment:'Pergament', grid:'Raster', shore:'Küste',
      t_select:'Auswahl', t_landmass:'Land', t_erase:'Meer', t_terrain:'Gelände', t_symbol:'Symbol',
      t_river:'Fluss', t_road:'Straße', t_label:'Beschriftung', t_pan:'Verschieben', t_eyedrop:'Pipette',
      o_landmass:'Land / Küste', o_brushsize:'Pinselgröße', o_rough:'Küstenrauheit',
      o_landcolor:'Landfarbe', o_shorew:'Küstenbreite', o_shorestyle:'Küstenstil', o_shore_sandy:'Sandig', o_shore_rocky:'Felsig', o_shore_reef:'Riff',
      o_smooth:'Küste glätten', o_clearland:'Land löschen',
      h_landmass:'Ziehen, um Land zu malen. Das Werkzeug "Meer" löscht Land und Gelände gleichzeitig.',
      o_terrain:'Gelände malen', o_opacity:'Deckkraft', o_clip:'Nur auf Land malen',
      o_clearterrain:'Geländeebene löschen',
      h_terrain:'Muster werden bei jedem Pinselstrich zufällig gestreut — kein wiederholtes Muster.', t_elevation:'Höhe', o_elevation:'Höhenrelief', o_elevstrength:'Stärke', o_elevlower:'Absenkmodus', o_clearelevation:'Höhendaten löschen', o_elevdisplay:'Anzeige', o_elevhillshade:'Schummerung (Hillshade)', o_elevcontours:'Höhenlinien', o_contourinterval:'Höhenlinienabstand', h_elevation:'Ziehen zum Anheben; bei aktivem "Absenkmodus" wird das Gelände vertieft. Die Schummerung aktualisiert sich automatisch.',
      o_symbol:'Symbol', o_size:'Größe', o_rot:'Drehung', o_hue:'Farbton',
      o_wear:'Abnutzung', o_jitter:'Zufällige Platzierung',
      h_symbol:'Symbol aus der Bibliothek wählen, auf die Karte klicken. Mit "Auswahl" verschieben; Entf zum Löschen.',
      o_river:'Fluss', o_width:'Breite', o_meander:'Mäander',
      o_taper:'An der Quelle verjüngen', o_color:'Farbe',
      h_path:'Klicken, um Punkte hinzuzufügen. Enter/Doppelklick zum Beenden, Esc zum Abbrechen.',
      o_road:'Straße / Karawanenroute',
      o_label:'Beschriftung', o_preset:'Stilvorlage', o_curve:'Krümmung', o_track:'Zeichenabstand',
      h_label:'Vorlage wählen, Text eingeben, auf die Karte klicken. Wirkt sofort bei ausgewählter Beschriftung.',
      o_eyedrop:'Texturpipette', o_eye_nosample:'Noch keine Probe entnommen',
      o_eye_radius:'Probenradius', o_eye_brush:'Pinselgröße',
      o_eye_pick:'① Bereich wählen', o_eye_paint:'② Malen starten', o_eye_clear:'Probe löschen',
      h_eyedrop:'① Bereich wählen: Kreis aufziehen. ② Malen: Textur auf die Karte auftragen.',
      eyeOk:'✓ Textur entnommen', eyeFail:'Entnahme fehlgeschlagen — über Land/Gelände versuchen.',
      eyePick:'Auf der Karte klicken und ziehen → Kreisgröße wählen → loslassen.',
      eyePaint:'Auf der Karte klicken und ziehen → Textur wird aufgetragen.',
      eyeNeed:'Zuerst mit ① Bereich wählen eine Textur entnehmen.',
      o_selection:'Auswahl', o_nosel:'Nichts ausgewählt', o_dup:'Duplizieren', o_del:'Löschen',
      o_scalebar:'Maßstabsleiste', o_scvis:'Auf der Karte anzeigen', o_sclen:'Länge',
      o_scsize:'Textgröße', o_scsegs:'Segmente',
      h_scale:'Maßstabsleiste auf der Karte ziehen, um sie zu verschieben.',
      o_view:'Ansicht', o_fit:'An Fenster anpassen', o_100:'100 %',
      h_pan:'Rechtsklick + ziehen, Mittelklick, Leertaste + ziehen oder Pfeiltasten zum Verschieben.',
      tab_layers:'Ebenen', tab_library:'Bibliothek', tab_history:'Verlauf',
      ref_title:'Referenzbild', ref_export:'In Export einschließen', ref_clear:'Referenz entfernen',
      sym_upload:'+ PNG-Symbol hochladen', sym_upload_done:'Symbol(e) geladen', sym_del:'Löschen', sym_search:'Symbole durchsuchen...',
      st_pos:'Position', st_zoom:'Zoom', st_size:'Leinwand', st_tool:'Werkzeug',
      cancel:'Abbrechen', ok:'OK',
      locked:'Ebene ist gesperrt oder ausgeblendet.', needtext:'Zuerst den Beschriftungstext eingeben.',
      exported:'Exportiert:', saved:'Projekt gespeichert.', loaded:'Projekt geladen.',
      badfile:'Ungültige Projektdatei.', newmap:'Neue Karte erstellt.',
      confirmNew:'Die aktuelle Karte wird verworfen. Leinwandgröße wählen:',
      confirmSize:'Das Ändern der Leinwandgröße skaliert vorhandene Ebenen. Fortfahren?',
      histStart:'Anfang', selNone:'Nichts ausgewählt', symbols:'Symbole',
      selScale:'Maßstabsleiste ausgewählt',
      o_zorder:'Ebenenreihenfolge', o_front:'In den Vordergrund', o_back:'In den Hintergrund',
      o_fwd:'Eine Ebene vor', o_bwd:'Eine Ebene zurück',
      o_group:'Gruppieren', o_ungroup:'Gruppierung aufheben',
      selMulti:'Objekte ausgewählt',
      t_lake:'See', o_lake:'See', h_lake:'Klicken, um Punkte hinzuzufügen, ab 3 Punkten mit Enter schließen.', t_territory:'Gebiet', o_territory:'Gebiet', o_territorycolor:'Füllfarbe', o_territorybcolor:'Randfarbe', h_territory:'Klicken, um Punkte hinzuzufügen, ab 3 Punkten mit Enter schließen.',
      o_lakecolor:'Seefarbe',
      o_symbbrush:'Pinselmodus', o_symbdensity:'Dichte', o_clipland:'An Land klemmen (Pinsel)',
      o_windrose:'Windrose', o_wrvis:'Auf der Karte anzeigen', o_wrsize:'Größe',
      o_wrstyle_classic:'Klassisch', o_wrstyle_minimal:'Schlicht', o_wrstyle:'Stil', o_wrcolor:'Farbe', h_windrose:'Auf der Karte ziehen, um sie zu verschieben.',
      o_snap:'Am Raster ausrichten', o_snapsize:'Rastergröße',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    fr: {
      new:'Nouveau', open:'Ouvrir', save:'Enregistrer', parchment:'Parchemin', grid:'Grille', shore:'Rivage',
      t_select:'Sélection', t_landmass:'Terre', t_erase:'Mer', t_terrain:'Terrain', t_symbol:'Symbole',
      t_river:'Rivière', t_road:'Route', t_label:'Étiquette', t_pan:'Déplacer', t_eyedrop:'Pipette',
      o_landmass:'Terre / Côte', o_brushsize:'Taille du pinceau', o_rough:'Irrégularité de la côte',
      o_landcolor:'Couleur de la terre', o_shorew:'Largeur du rivage', o_shorestyle:'Style de côte', o_shore_sandy:'Sablonneuse', o_shore_rocky:'Rocheuse', o_shore_reef:'Récif',
      o_smooth:'Lisser la côte', o_clearland:'Effacer la terre',
      h_landmass:"Glisser pour peindre la terre. L'outil « Mer » efface à la fois la terre et le terrain.",
      o_terrain:'Peinture de terrain', o_opacity:'Opacité', o_clip:'Peindre uniquement sur la terre',
      o_clearterrain:'Effacer le calque de terrain',
      h_terrain:'Les motifs sont dispersés aléatoirement à chaque coup de pinceau — aucun motif répétitif.', t_elevation:'Relief', o_elevation:'Relief', o_elevstrength:'Intensité', o_elevlower:'Mode abaissement', o_clearelevation:'Effacer le relief', o_elevdisplay:'Affichage', o_elevhillshade:'Estompage (hillshade)', o_elevcontours:'Courbes de niveau', o_contourinterval:'Intervalle des courbes', h_elevation:'Faites glisser pour surélever ; activez le « mode abaissement » pour creuser. L\'estompage se met à jour automatiquement.',
      o_symbol:'Symbole', o_size:'Taille', o_rot:'Rotation', o_hue:'Teinte',
      o_wear:'Usure', o_jitter:'Placement aléatoire',
      h_symbol:'Choisissez un symbole dans la bibliothèque, cliquez sur la carte. Utilisez « Sélection » pour déplacer ; Suppr pour effacer.',
      o_river:'Rivière', o_width:'Largeur', o_meander:'Méandre',
      o_taper:'Affiner à la source', o_color:'Couleur',
      h_path:'Cliquez pour ajouter des points. Entrée / double-clic pour terminer, Échap pour annuler.',
      o_road:'Route / Route caravanière',
      o_label:'Étiquette', o_preset:'Style prédéfini', o_curve:'Courbure', o_track:'Espacement des lettres',
      h_label:"Choisissez un style, saisissez le texte, cliquez sur la carte. S'applique instantanément à l'étiquette sélectionnée.",
      o_eyedrop:'Pipette de texture', o_eye_nosample:"Aucun échantillon pour l'instant",
      o_eye_radius:"Rayon d'échantillonnage", o_eye_brush:'Taille du pinceau',
      o_eye_pick:'① Choisir une zone', o_eye_paint:'② Commencer à peindre', o_eye_clear:"Effacer l'échantillon",
      h_eyedrop:'① Choisir une zone : tracez un cercle. ② Peindre : appliquez la texture sur la carte.',
      eyeOk:'✓ Texture échantillonnée', eyeFail:"Échec de l'échantillonnage — essayez sur la terre/le terrain.",
      eyePick:'Cliquez et glissez sur la carte → définissez la taille du cercle → relâchez.',
      eyePaint:'Cliquez et glissez sur la carte → la texture est appliquée.',
      eyeNeed:"Échantillonnez d'abord une texture avec ① Choisir une zone.",
      o_selection:'Sélection', o_nosel:'Rien de sélectionné', o_dup:'Dupliquer', o_del:'Supprimer',
      o_scalebar:'Échelle', o_scvis:'Afficher sur la carte', o_sclen:'Longueur',
      o_scsize:'Taille du texte', o_scsegs:'Segments',
      h_scale:"Faites glisser l'échelle sur la carte pour la repositionner.",
      o_view:'Vue', o_fit:"Ajuster à l'écran", o_100:'100 %',
      h_pan:'Clic droit + glisser, clic molette, Espace + glisser, ou flèches pour vous déplacer.',
      tab_layers:'Calques', tab_library:'Bibliothèque', tab_history:'Historique',
      ref_title:'Image de référence', ref_export:"Inclure dans l'export", ref_clear:'Retirer la référence',
      sym_upload:'+ Importer un symbole PNG', sym_upload_done:'symbole(s) chargé(s)', sym_del:'Supprimer', sym_search:'Rechercher un symbole...',
      st_pos:'Position', st_zoom:'Zoom', st_size:'Toile', st_tool:'Outil',
      cancel:'Annuler', ok:'OK',
      locked:'Le calque est verrouillé ou masqué.', needtext:"Saisissez d'abord le texte de l'étiquette.",
      exported:'Exporté :', saved:'Projet enregistré.', loaded:'Projet chargé.',
      badfile:'Fichier de projet invalide.', newmap:'Nouvelle carte créée.',
      confirmNew:'La carte actuelle sera abandonnée. Choisissez une taille de toile :',
      confirmSize:'Changer la taille de la toile redimensionne les calques existants. Continuer ?',
      histStart:'Début', selNone:'Rien de sélectionné', symbols:'symboles',
      selScale:'Échelle sélectionnée',
      o_zorder:"Ordre d'empilement", o_front:'Mettre au premier plan', o_back:"Mettre à l'arrière-plan",
      o_fwd:'Avancer', o_bwd:'Reculer',
      o_group:'Grouper', o_ungroup:'Dissocier',
      selMulti:'objets sélectionnés',
      t_lake:'Lac', o_lake:'Lac', h_lake:'Cliquez pour ajouter des points, puis Entrée (3 points min.) pour fermer.', t_territory:'Territoire', o_territory:'Territoire', o_territorycolor:'Couleur de remplissage', o_territorybcolor:'Couleur de bordure', h_territory:'Cliquez pour ajouter des points, puis Entrée (3 points min.) pour fermer.',
      o_lakecolor:'Couleur du lac',
      o_symbbrush:'Mode pinceau', o_symbdensity:'Densité', o_clipland:'Limiter à la terre (pinceau)',
      o_windrose:'Rose des vents', o_wrvis:'Afficher sur la carte', o_wrsize:'Taille',
      o_wrstyle_classic:'Classique', o_wrstyle_minimal:'Minimaliste', o_wrstyle:'Style', o_wrcolor:'Couleur', h_windrose:'Faites glisser sur la carte pour repositionner.',
      o_snap:'Aligner sur la grille', o_snapsize:'Taille de la grille',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    es: {
      new:'Nuevo', open:'Abrir', save:'Guardar', parchment:'Pergamino', grid:'Cuadrícula', shore:'Costa',
      t_select:'Seleccionar', t_landmass:'Tierra', t_erase:'Mar', t_terrain:'Terreno', t_symbol:'Símbolo',
      t_river:'Río', t_road:'Camino', t_label:'Etiqueta', t_pan:'Desplazar', t_eyedrop:'Muestra',
      o_landmass:'Tierra / Costa', o_brushsize:'Tamaño del pincel', o_rough:'Rugosidad de la costa',
      o_landcolor:'Color de la tierra', o_shorew:'Ancho de la costa', o_shorestyle:'Estilo de costa', o_shore_sandy:'Arenosa', o_shore_rocky:'Rocosa', o_shore_reef:'Arrecife',
      o_smooth:'Suavizar costa', o_clearland:'Borrar tierra',
      h_landmass:'Arrastra para pintar tierra. La herramienta «Mar» borra tanto la tierra como el terreno.',
      o_terrain:'Pintura de terreno', o_opacity:'Opacidad', o_clip:'Pintar solo sobre tierra',
      o_clearterrain:'Borrar capa de terreno',
      h_terrain:'Los motivos se dispersan aleatoriamente en cada trazo — sin patrones repetidos.', t_elevation:'Relieve', o_elevation:'Relieve', o_elevstrength:'Intensidad', o_elevlower:'Modo de rebajar', o_clearelevation:'Borrar relieve', o_elevdisplay:'Visualización', o_elevhillshade:'Sombreado (hillshade)', o_elevcontours:'Curvas de nivel', o_contourinterval:'Intervalo de curvas', h_elevation:'Arrastra para elevar el terreno; activa el «modo de rebajar» para hundirlo. El sombreado se actualiza automáticamente.',
      o_symbol:'Símbolo', o_size:'Tamaño', o_rot:'Rotación', o_hue:'Tono',
      o_wear:'Desgaste', o_jitter:'Colocación aleatoria',
      h_symbol:'Elige un símbolo de la biblioteca, haz clic en el mapa. Usa «Seleccionar» para mover; Supr para borrar.',
      o_river:'Río', o_width:'Ancho', o_meander:'Meandro',
      o_taper:'Adelgazar en el nacimiento', o_color:'Color',
      h_path:'Haz clic para añadir puntos. Intro / doble clic para terminar, Esc para cancelar.',
      o_road:'Camino / Ruta de caravanas',
      o_label:'Etiqueta', o_preset:'Estilo predefinido', o_curve:'Curvatura', o_track:'Espaciado de letras',
      h_label:'Elige un estilo, escribe el texto, haz clic en el mapa. Se aplica al instante a la etiqueta seleccionada.',
      o_eyedrop:'Muestreador de textura', o_eye_nosample:'Aún no hay muestra',
      o_eye_radius:'Radio de muestreo', o_eye_brush:'Tamaño del pincel',
      o_eye_pick:'① Elegir área', o_eye_paint:'② Empezar a pintar', o_eye_clear:'Borrar muestra',
      h_eyedrop:'① Elegir área: arrastra para dibujar un círculo. ② Pintar: aplica la textura al mapa.',
      eyeOk:'✓ Textura muestreada', eyeFail:'Muestreo fallido — prueba sobre tierra/terreno.',
      eyePick:'Haz clic y arrastra en el mapa → ajusta el tamaño del círculo → suelta.',
      eyePaint:'Haz clic y arrastra en el mapa → se aplica la textura.',
      eyeNeed:'Primero muestrea una textura con ① Elegir área.',
      o_selection:'Selección', o_nosel:'Nada seleccionado', o_dup:'Duplicar', o_del:'Borrar',
      o_scalebar:'Barra de escala', o_scvis:'Mostrar en el mapa', o_sclen:'Longitud',
      o_scsize:'Tamaño del texto', o_scsegs:'Segmentos',
      h_scale:'Arrastra la barra de escala en el mapa para reposicionarla.',
      o_view:'Vista', o_fit:'Ajustar a la pantalla', o_100:'100 %',
      h_pan:'Clic derecho + arrastrar, clic central, Espacio + arrastrar, o flechas para desplazarte.',
      tab_layers:'Capas', tab_library:'Biblioteca', tab_history:'Historial',
      ref_title:'Imagen de referencia', ref_export:'Incluir en la exportación', ref_clear:'Quitar referencia',
      sym_upload:'+ Subir símbolo PNG', sym_upload_done:'símbolo(s) cargado(s)', sym_del:'Borrar', sym_search:'Buscar símbolos...',
      st_pos:'Posición', st_zoom:'Zoom', st_size:'Lienzo', st_tool:'Herramienta',
      cancel:'Cancelar', ok:'Aceptar',
      locked:'La capa está bloqueada u oculta.', needtext:'Escribe primero el texto de la etiqueta.',
      exported:'Exportado:', saved:'Proyecto guardado.', loaded:'Proyecto cargado.',
      badfile:'Archivo de proyecto no válido.', newmap:'Mapa nuevo creado.',
      confirmNew:'Se descartará el mapa actual. Elige un tamaño de lienzo:',
      confirmSize:'Cambiar el tamaño del lienzo reescala las capas existentes. ¿Continuar?',
      histStart:'Inicio', selNone:'Nada seleccionado', symbols:'símbolos',
      selScale:'Barra de escala seleccionada',
      o_zorder:'Orden de apilado', o_front:'Traer al frente', o_back:'Enviar al fondo',
      o_fwd:'Avanzar', o_bwd:'Retroceder',
      o_group:'Agrupar', o_ungroup:'Desagrupar',
      selMulti:'objetos seleccionados',
      t_lake:'Lago', o_lake:'Lago', h_lake:'Haz clic para añadir puntos; con 3 o más, pulsa Intro para cerrar.', t_territory:'Territorio', o_territory:'Territorio', o_territorycolor:'Color de relleno', o_territorybcolor:'Color del borde', h_territory:'Haz clic para añadir puntos; con 3 o más, pulsa Intro para cerrar.',
      o_lakecolor:'Color del lago',
      o_symbbrush:'Modo pincel', o_symbdensity:'Densidad', o_clipland:'Ajustar a tierra (pincel)',
      o_windrose:'Rosa de los vientos', o_wrvis:'Mostrar en el mapa', o_wrsize:'Tamaño',
      o_wrstyle_classic:'Clásico', o_wrstyle_minimal:'Minimalista', o_wrstyle:'Estilo', o_wrcolor:'Color', h_windrose:'Arrastra en el mapa para reposicionarla.',
      o_snap:'Ajustar a la cuadrícula', o_snapsize:'Tamaño de la cuadrícula',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    it: {
      new:'Nuovo', open:'Apri', save:'Salva', parchment:'Pergamena', grid:'Griglia', shore:'Costa',
      t_select:'Seleziona', t_landmass:'Terra', t_erase:'Mare', t_terrain:'Terreno', t_symbol:'Simbolo',
      t_river:'Fiume', t_road:'Strada', t_label:'Etichetta', t_pan:'Sposta', t_eyedrop:'Campiona',
      o_landmass:'Terra / Costa', o_brushsize:'Dimensione pennello', o_rough:'Irregolarità della costa',
      o_landcolor:'Colore della terra', o_shorew:'Larghezza della costa', o_shorestyle:'Stile della costa', o_shore_sandy:'Sabbiosa', o_shore_rocky:'Rocciosa', o_shore_reef:'Barriera corallina',
      o_smooth:'Smussa la costa', o_clearland:'Cancella terra',
      h_landmass:'Trascina per disegnare la terra. Lo strumento «Mare» cancella sia la terra sia il terreno.',
      o_terrain:'Pittura del terreno', o_opacity:'Opacità', o_clip:'Dipingi solo sulla terra',
      o_clearterrain:'Cancella livello terreno',
      h_terrain:'I motivi vengono sparsi casualmente a ogni pennellata — nessun motivo ripetuto.', t_elevation:'Rilievo', o_elevation:'Rilievo', o_elevstrength:'Intensità', o_elevlower:'Modalità abbassamento', o_clearelevation:'Cancella rilievo', o_elevdisplay:'Visualizzazione', o_elevhillshade:'Ombreggiatura (hillshade)', o_elevcontours:'Curve di livello', o_contourinterval:'Intervallo curve di livello', h_elevation:'Trascina per sollevare il terreno; attiva la "modalità abbassamento" per scavarlo. L\'ombreggiatura si aggiorna automaticamente.',
      o_symbol:'Simbolo', o_size:'Dimensione', o_rot:'Rotazione', o_hue:'Tonalità',
      o_wear:'Usura', o_jitter:'Posizionamento casuale',
      h_symbol:'Scegli un simbolo dalla libreria, clicca sulla mappa. Usa «Seleziona» per spostare; Canc per eliminare.',
      o_river:'Fiume', o_width:'Spessore', o_meander:'Meandro',
      o_taper:'Assottiglia alla sorgente', o_color:'Colore',
      h_path:'Clicca per aggiungere punti. Invio / doppio clic per terminare, Esc per annullare.',
      o_road:'Strada / Rotta carovaniera',
      o_label:'Etichetta', o_preset:'Stile predefinito', o_curve:'Curvatura', o_track:'Spaziatura lettere',
      h_label:"Scegli uno stile, scrivi il testo, clicca sulla mappa. Si applica subito all'etichetta selezionata.",
      o_eyedrop:'Campionatore texture', o_eye_nosample:'Nessun campione ancora',
      o_eye_radius:'Raggio campionamento', o_eye_brush:'Dimensione pennello',
      o_eye_pick:'① Scegli area', o_eye_paint:'② Inizia a dipingere', o_eye_clear:'Cancella campione',
      h_eyedrop:'① Scegli area: trascina per disegnare un cerchio. ② Dipingi: applica la texture alla mappa.',
      eyeOk:'✓ Texture campionata', eyeFail:'Campionamento non riuscito — prova su terra/terreno.',
      eyePick:'Clicca e trascina sulla mappa → imposta la dimensione del cerchio → rilascia.',
      eyePaint:'Clicca e trascina sulla mappa → la texture viene applicata.',
      eyeNeed:'Prima campiona una texture con ① Scegli area.',
      o_selection:'Selezione', o_nosel:'Nessun oggetto selezionato', o_dup:'Duplica', o_del:'Elimina',
      o_scalebar:'Barra della scala', o_scvis:'Mostra sulla mappa', o_sclen:'Lunghezza',
      o_scsize:'Dimensione testo', o_scsegs:'Segmenti',
      h_scale:'Trascina la barra della scala sulla mappa per riposizionarla.',
      o_view:'Visualizza', o_fit:'Adatta allo schermo', o_100:'100%',
      h_pan:'Clic destro + trascina, clic centrale, Spazio + trascina, o frecce per spostarti.',
      tab_layers:'Livelli', tab_library:'Libreria', tab_history:'Cronologia',
      ref_title:'Immagine di riferimento', ref_export:"Includi nell'esportazione", ref_clear:'Rimuovi riferimento',
      sym_upload:'+ Carica simbolo PNG', sym_upload_done:'simbolo/i caricato/i', sym_del:'Elimina', sym_search:'Cerca simboli...',
      st_pos:'Posizione', st_zoom:'Zoom', st_size:'Tela', st_tool:'Strumento',
      cancel:'Annulla', ok:'OK',
      locked:'Il livello è bloccato o nascosto.', needtext:"Scrivi prima il testo dell'etichetta.",
      exported:'Esportato:', saved:'Progetto salvato.', loaded:'Progetto caricato.',
      badfile:'File di progetto non valido.', newmap:'Nuova mappa creata.',
      confirmNew:'La mappa attuale verrà eliminata. Scegli una dimensione della tela:',
      confirmSize:'Cambiare la dimensione della tela ridimensiona i livelli esistenti. Continuare?',
      histStart:'Inizio', selNone:'Nessun oggetto selezionato', symbols:'simboli',
      selScale:'Barra della scala selezionata',
      o_zorder:'Ordine', o_front:'Porta in primo piano', o_back:'Porta sullo sfondo',
      o_fwd:'Avanti di uno', o_bwd:'Indietro di uno',
      o_group:'Raggruppa', o_ungroup:'Separa',
      selMulti:'oggetti selezionati',
      t_lake:'Lago', o_lake:'Lago', h_lake:'Clicca per aggiungere punti, con 3+ punti premi Invio per chiudere.', t_territory:'Territorio', o_territory:'Territorio', o_territorycolor:'Colore di riempimento', o_territorybcolor:'Colore del bordo', h_territory:'Clicca per aggiungere punti, con 3+ punti premi Invio per chiudere.',
      o_lakecolor:'Colore del lago',
      o_symbbrush:'Modalità pennello', o_symbdensity:'Densità', o_clipland:'Limita alla terra (pennello)',
      o_windrose:'Rosa dei venti', o_wrvis:'Mostra sulla mappa', o_wrsize:'Dimensione',
      o_wrstyle_classic:'Classico', o_wrstyle_minimal:'Minimalista', o_wrstyle:'Stile', o_wrcolor:'Colore', h_windrose:'Trascina sulla mappa per riposizionarla.',
      o_snap:'Aggancia alla griglia', o_snapsize:'Dimensione griglia',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    pt: {
      new:'Novo', open:'Abrir', save:'Guardar', parchment:'Pergaminho', grid:'Grelha', shore:'Costa',
      t_select:'Selecionar', t_landmass:'Terra', t_erase:'Mar', t_terrain:'Terreno', t_symbol:'Símbolo',
      t_river:'Rio', t_road:'Estrada', t_label:'Etiqueta', t_pan:'Deslocar', t_eyedrop:'Amostra',
      o_landmass:'Terra / Costa', o_brushsize:'Tamanho do pincel', o_rough:'Irregularidade da costa',
      o_landcolor:'Cor da terra', o_shorew:'Largura da costa', o_shorestyle:'Estilo da costa', o_shore_sandy:'Arenosa', o_shore_rocky:'Rochosa', o_shore_reef:'Recife',
      o_smooth:'Suavizar costa', o_clearland:'Limpar terra',
      h_landmass:'Arraste para pintar terra. A ferramenta «Mar» apaga a terra e o terreno em simultâneo.',
      o_terrain:'Pintura de terreno', o_opacity:'Opacidade', o_clip:'Pintar só sobre terra',
      o_clearterrain:'Limpar camada de terreno',
      h_terrain:'Os motivos são espalhados aleatoriamente a cada pincelada — sem padrões repetidos.', t_elevation:'Relevo', o_elevation:'Relevo', o_elevstrength:'Intensidade', o_elevlower:'Modo de rebaixar', o_clearelevation:'Limpar relevo', o_elevdisplay:'Visualização', o_elevhillshade:'Sombreamento (hillshade)', o_elevcontours:'Linhas de contorno', o_contourinterval:'Intervalo das curvas', h_elevation:'Arraste para elevar o terreno; ative o "modo de rebaixar" para escavá-lo. O sombreamento atualiza-se automaticamente.',
      o_symbol:'Símbolo', o_size:'Tamanho', o_rot:'Rotação', o_hue:'Matiz',
      o_wear:'Desgaste', o_jitter:'Colocação aleatória',
      h_symbol:'Escolha um símbolo na biblioteca, clique no mapa. Use «Selecionar» para mover; Delete para apagar.',
      o_river:'Rio', o_width:'Largura', o_meander:'Meandro',
      o_taper:'Afinar na nascente', o_color:'Cor',
      h_path:'Clique para adicionar pontos. Enter / duplo clique para terminar, Esc para cancelar.',
      o_road:'Estrada / Rota de caravanas',
      o_label:'Etiqueta', o_preset:'Estilo predefinido', o_curve:'Curvatura', o_track:'Espaçamento das letras',
      h_label:'Escolha um estilo, escreva o texto, clique no mapa. Aplica-se de imediato à etiqueta selecionada.',
      o_eyedrop:'Amostrador de textura', o_eye_nosample:'Ainda sem amostra',
      o_eye_radius:'Raio de amostragem', o_eye_brush:'Tamanho do pincel',
      o_eye_pick:'① Escolher área', o_eye_paint:'② Começar a pintar', o_eye_clear:'Limpar amostra',
      h_eyedrop:'① Escolher área: arraste para desenhar um círculo. ② Pintar: aplica a textura ao mapa.',
      eyeOk:'✓ Textura amostrada', eyeFail:'Falha na amostragem — tente sobre terra/terreno.',
      eyePick:'Clique e arraste no mapa → defina o tamanho do círculo → solte.',
      eyePaint:'Clique e arraste no mapa → a textura é aplicada.',
      eyeNeed:'Primeiro faça uma amostra com ① Escolher área.',
      o_selection:'Seleção', o_nosel:'Nada selecionado', o_dup:'Duplicar', o_del:'Apagar',
      o_scalebar:'Barra de escala', o_scvis:'Mostrar no mapa', o_sclen:'Comprimento',
      o_scsize:'Tamanho do texto', o_scsegs:'Segmentos',
      h_scale:'Arraste a barra de escala no mapa para a reposicionar.',
      o_view:'Vista', o_fit:'Ajustar ao ecrã', o_100:'100%',
      h_pan:'Clique direito + arrastar, clique do meio, Espaço + arrastar, ou setas para deslocar.',
      tab_layers:'Camadas', tab_library:'Biblioteca', tab_history:'Histórico',
      ref_title:'Imagem de referência', ref_export:'Incluir na exportação', ref_clear:'Remover referência',
      sym_upload:'+ Carregar símbolo PNG', sym_upload_done:'símbolo(s) carregado(s)', sym_del:'Apagar', sym_search:'Pesquisar símbolos...',
      st_pos:'Posição', st_zoom:'Zoom', st_size:'Tela', st_tool:'Ferramenta',
      cancel:'Cancelar', ok:'OK',
      locked:'A camada está bloqueada ou oculta.', needtext:'Escreva primeiro o texto da etiqueta.',
      exported:'Exportado:', saved:'Projeto guardado.', loaded:'Projeto carregado.',
      badfile:'Ficheiro de projeto inválido.', newmap:'Novo mapa criado.',
      confirmNew:'O mapa atual será descartado. Escolha um tamanho de tela:',
      confirmSize:'Alterar o tamanho da tela redimensiona as camadas existentes. Continuar?',
      histStart:'Início', selNone:'Nada selecionado', symbols:'símbolos',
      selScale:'Barra de escala selecionada',
      o_zorder:'Ordem de sobreposição', o_front:'Trazer para a frente', o_back:'Enviar para trás',
      o_fwd:'Avançar', o_bwd:'Recuar',
      o_group:'Agrupar', o_ungroup:'Desagrupar',
      selMulti:'objetos selecionados',
      t_lake:'Lago', o_lake:'Lago', h_lake:'Clique para adicionar pontos; com 3+ pontos, prima Enter para fechar.', t_territory:'Território', o_territory:'Território', o_territorycolor:'Cor de preenchimento', o_territorybcolor:'Cor do contorno', h_territory:'Clique para adicionar pontos; com 3+ pontos, prima Enter para fechar.',
      o_lakecolor:'Cor do lago',
      o_symbbrush:'Modo pincel', o_symbdensity:'Densidade', o_clipland:'Restringir à terra (pincel)',
      o_windrose:'Rosa dos ventos', o_wrvis:'Mostrar no mapa', o_wrsize:'Tamanho',
      o_wrstyle_classic:'Clássico', o_wrstyle_minimal:'Minimalista', o_wrstyle:'Estilo', o_wrcolor:'Cor', h_windrose:'Arraste no mapa para reposicionar.',
      o_snap:'Alinhar à grelha', o_snapsize:'Tamanho da grelha',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    nl: {
      new:'Nieuw', open:'Openen', save:'Opslaan', parchment:'Perkament', grid:'Raster', shore:'Kust',
      t_select:'Selecteren', t_landmass:'Land', t_erase:'Zee', t_terrain:'Terrein', t_symbol:'Symbool',
      t_river:'Rivier', t_road:'Weg', t_label:'Label', t_pan:'Verschuiven', t_eyedrop:'Pipet',
      o_landmass:'Land / Kust', o_brushsize:'Penseelgrootte', o_rough:'Ruwheid van de kust',
      o_landcolor:'Landkleur', o_shorew:'Kustbreedte', o_shorestyle:'Kuststijl', o_shore_sandy:'Zandig', o_shore_rocky:'Rotsachtig', o_shore_reef:'Rif',
      o_smooth:'Kust gladstrijken', o_clearland:'Land wissen',
      h_landmass:'Sleep om land te tekenen. Het gereedschap "Zee" wist zowel land als terrein.',
      o_terrain:'Terrein schilderen', o_opacity:'Dekking', o_clip:'Alleen op land schilderen',
      o_clearterrain:'Terreinlaag wissen',
      h_terrain:'Patronen worden bij elke penseelstreek willekeurig verspreid — geen herhalend patroon.', t_elevation:'Reliëf', o_elevation:'Reliëf', o_elevstrength:'Sterkte', o_elevlower:'Verlagingsmodus', o_clearelevation:'Reliëf wissen', o_elevdisplay:'Weergave', o_elevhillshade:'Reliëfschaduw (hillshade)', o_elevcontours:'Hoogtelijnen', o_contourinterval:'Interval hoogtelijnen', h_elevation:'Sleep om te verhogen; schakel "Verlagingsmodus" in om te verlagen. De reliëfschaduw wordt automatisch bijgewerkt.',
      o_symbol:'Symbool', o_size:'Grootte', o_rot:'Rotatie', o_hue:'Tint',
      o_wear:'Verwering', o_jitter:'Willekeurige plaatsing',
      h_symbol:'Kies een symbool uit de bibliotheek, klik op de kaart. Gebruik "Selecteren" om te verplaatsen; Delete om te wissen.',
      o_river:'Rivier', o_width:'Breedte', o_meander:'Meandering',
      o_taper:'Versmallen bij de bron', o_color:'Kleur',
      h_path:'Klik om punten toe te voegen. Enter / dubbelklik om te voltooien, Esc om te annuleren.',
      o_road:'Weg / Karavaanroute',
      o_label:'Label', o_preset:'Stijlvoorinstelling', o_curve:'Kromming', o_track:'Letterspatiëring',
      h_label:'Kies een stijl, typ de tekst, klik op de kaart. Wordt direct toegepast op een geselecteerd label.',
      o_eyedrop:'Textuurpipet', o_eye_nosample:'Nog geen monster genomen',
      o_eye_radius:'Bemonsteringsstraal', o_eye_brush:'Penseelgrootte',
      o_eye_pick:'① Gebied kiezen', o_eye_paint:'② Beginnen met schilderen', o_eye_clear:'Monster wissen',
      h_eyedrop:'① Gebied kiezen: sleep om een cirkel te tekenen. ② Schilderen: breng de textuur aan op de kaart.',
      eyeOk:'✓ Textuur bemonsterd', eyeFail:'Bemonstering mislukt — probeer boven land/terrein.',
      eyePick:'Klik en sleep op de kaart → stel de cirkelgrootte in → laat los.',
      eyePaint:'Klik en sleep op de kaart → de textuur wordt toegepast.',
      eyeNeed:'Neem eerst een monster met ① Gebied kiezen.',
      o_selection:'Selectie', o_nosel:'Niets geselecteerd', o_dup:'Dupliceren', o_del:'Verwijderen',
      o_scalebar:'Schaalbalk', o_scvis:'Tonen op de kaart', o_sclen:'Lengte',
      o_scsize:'Tekstgrootte', o_scsegs:'Segmenten',
      h_scale:'Sleep de schaalbalk op de kaart om deze te verplaatsen.',
      o_view:'Weergave', o_fit:'Passend maken', o_100:'100%',
      h_pan:'Rechtsklikken + slepen, middelklik, Spatie + slepen, of pijltjestoetsen om te verschuiven.',
      tab_layers:'Lagen', tab_library:'Bibliotheek', tab_history:'Geschiedenis',
      ref_title:'Referentieafbeelding', ref_export:'Opnemen in export', ref_clear:'Referentie verwijderen',
      sym_upload:'+ PNG-symbool uploaden', sym_upload_done:'symbo(o)l(en) geladen', sym_del:'Verwijderen', sym_search:'Symbolen zoeken...',
      st_pos:'Positie', st_zoom:'Zoom', st_size:'Canvas', st_tool:'Gereedschap',
      cancel:'Annuleren', ok:'OK',
      locked:'Laag is vergrendeld of verborgen.', needtext:'Typ eerst de labeltekst.',
      exported:'Geëxporteerd:', saved:'Project opgeslagen.', loaded:'Project geladen.',
      badfile:'Ongeldig projectbestand.', newmap:'Nieuwe kaart aangemaakt.',
      confirmNew:'De huidige kaart wordt verwijderd. Kies een canvasgrootte:',
      confirmSize:'Het wijzigen van de canvasgrootte schaalt bestaande lagen. Doorgaan?',
      histStart:'Begin', selNone:'Niets geselecteerd', symbols:'symbolen',
      selScale:'Schaalbalk geselecteerd',
      o_zorder:'Volgorde', o_front:'Naar voorgrond', o_back:'Naar achtergrond',
      o_fwd:'Naar voren', o_bwd:'Naar achteren',
      o_group:'Groeperen', o_ungroup:'Groepering opheffen',
      selMulti:'objecten geselecteerd',
      t_lake:'Meer', o_lake:'Meer', h_lake:'Klik om punten toe te voegen, druk vanaf 3 punten op Enter om te sluiten.', t_territory:'Gebied', o_territory:'Gebied', o_territorycolor:'Vulkleur', o_territorybcolor:'Randkleur', h_territory:'Klik om punten toe te voegen, druk vanaf 3 punten op Enter om te sluiten.',
      o_lakecolor:'Kleur van het meer',
      o_symbbrush:'Penseelmodus', o_symbdensity:'Dichtheid', o_clipland:'Beperken tot land (penseel)',
      o_windrose:'Windroos', o_wrvis:'Tonen op de kaart', o_wrsize:'Grootte',
      o_wrstyle_classic:'Klassiek', o_wrstyle_minimal:'Minimalistisch', o_wrstyle:'Stijl', o_wrcolor:'Kleur', h_windrose:'Sleep op de kaart om te verplaatsen.',
      o_snap:'Uitlijnen op raster', o_snapsize:'Rastergrootte',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    pl: {
      new:'Nowy', open:'Otwórz', save:'Zapisz', parchment:'Pergamin', grid:'Siatka', shore:'Wybrzeże',
      t_select:'Zaznacz', t_landmass:'Ląd', t_erase:'Morze', t_terrain:'Teren', t_symbol:'Symbol',
      t_river:'Rzeka', t_road:'Droga', t_label:'Etykieta', t_pan:'Przesuń', t_eyedrop:'Próbnik',
      o_landmass:'Ląd / Wybrzeże', o_brushsize:'Rozmiar pędzla', o_rough:'Nieregularność wybrzeża',
      o_landcolor:'Kolor lądu', o_shorew:'Szerokość wybrzeża', o_shorestyle:'Styl wybrzeża', o_shore_sandy:'Piaszczyste', o_shore_rocky:'Skaliste', o_shore_reef:'Rafa',
      o_smooth:'Wygładź wybrzeże', o_clearland:'Wyczyść ląd',
      h_landmass:'Przeciągnij, aby malować ląd. Narzędzie „Morze” usuwa zarówno ląd, jak i teren.',
      o_terrain:'Malowanie terenu', o_opacity:'Krycie', o_clip:'Maluj tylko na lądzie',
      o_clearterrain:'Wyczyść warstwę terenu',
      h_terrain:'Wzory są losowo rozrzucane przy każdym pociągnięciu — bez powtarzającego się wzoru.', t_elevation:'Wysokość', o_elevation:'Rzeźba terenu', o_elevstrength:'Siła', o_elevlower:'Tryb obniżania', o_clearelevation:'Wyczyść rzeźbę terenu', o_elevdisplay:'Wyświetlanie', o_elevhillshade:'Cieniowanie (hillshade)', o_elevcontours:'Warstwice', o_contourinterval:'Odstęp warstwic', h_elevation:'Przeciągnij, aby podnieść teren; włącz „tryb obniżania”, aby go zagłębić. Cieniowanie aktualizuje się automatycznie.',
      o_symbol:'Symbol', o_size:'Rozmiar', o_rot:'Obrót', o_hue:'Odcień',
      o_wear:'Zużycie', o_jitter:'Losowe rozmieszczenie',
      h_symbol:'Wybierz symbol z biblioteki, kliknij na mapie. Użyj „Zaznacz”, aby przesunąć; Delete, aby usunąć.',
      o_river:'Rzeka', o_width:'Szerokość', o_meander:'Meandrowanie',
      o_taper:'Zwężaj przy źródle', o_color:'Kolor',
      h_path:'Kliknij, aby dodać punkty. Enter / podwójne kliknięcie kończy, Esc anuluje.',
      o_road:'Droga / Szlak karawan',
      o_label:'Etykieta', o_preset:'Styl predefiniowany', o_curve:'Wygięcie', o_track:'Odstępy między literami',
      h_label:'Wybierz styl, wpisz tekst, kliknij na mapie. Zmiany stosują się od razu do zaznaczonej etykiety.',
      o_eyedrop:'Próbnik tekstury', o_eye_nosample:'Brak pobranej próbki',
      o_eye_radius:'Promień próbkowania', o_eye_brush:'Rozmiar pędzla',
      o_eye_pick:'① Wybierz obszar', o_eye_paint:'② Zacznij malować', o_eye_clear:'Wyczyść próbkę',
      h_eyedrop:'① Wybierz obszar: przeciągnij, rysując okrąg. ② Maluj: nałóż teksturę na mapę.',
      eyeOk:'✓ Tekstura pobrana', eyeFail:'Pobieranie nie powiodło się — spróbuj nad lądem/terenem.',
      eyePick:'Kliknij i przeciągnij na mapie → ustaw rozmiar okręgu → puść.',
      eyePaint:'Kliknij i przeciągnij na mapie → tekstura zostaje nałożona.',
      eyeNeed:'Najpierw pobierz teksturę za pomocą ① Wybierz obszar.',
      o_selection:'Zaznaczenie', o_nosel:'Nic nie zaznaczono', o_dup:'Duplikuj', o_del:'Usuń',
      o_scalebar:'Podziałka', o_scvis:'Pokaż na mapie', o_sclen:'Długość',
      o_scsize:'Rozmiar tekstu', o_scsegs:'Segmenty',
      h_scale:'Przeciągnij podziałkę na mapie, aby ją przesunąć.',
      o_view:'Widok', o_fit:'Dopasuj do ekranu', o_100:'100%',
      h_pan:'Prawy przycisk + przeciągnij, środkowy przycisk, Spacja + przeciągnij lub strzałki, aby przesuwać.',
      tab_layers:'Warstwy', tab_library:'Biblioteka', tab_history:'Historia',
      ref_title:'Obraz referencyjny', ref_export:'Uwzględnij w eksporcie', ref_clear:'Usuń obraz referencyjny',
      sym_upload:'+ Wgraj symbol PNG', sym_upload_done:'wczytano symboli', sym_del:'Usuń', sym_search:'Szukaj symboli...',
      st_pos:'Pozycja', st_zoom:'Powiększenie', st_size:'Płótno', st_tool:'Narzędzie',
      cancel:'Anuluj', ok:'OK',
      locked:'Warstwa jest zablokowana lub ukryta.', needtext:'Najpierw wpisz tekst etykiety.',
      exported:'Wyeksportowano:', saved:'Projekt zapisany.', loaded:'Projekt wczytany.',
      badfile:'Nieprawidłowy plik projektu.', newmap:'Utworzono nową mapę.',
      confirmNew:'Bieżąca mapa zostanie odrzucona. Wybierz rozmiar płótna:',
      confirmSize:'Zmiana rozmiaru płótna przeskaluje istniejące warstwy. Kontynuować?',
      histStart:'Początek', selNone:'Nic nie zaznaczono', symbols:'symboli',
      selScale:'Zaznaczono podziałkę',
      o_zorder:'Kolejność warstw', o_front:'Przenieś na wierzch', o_back:'Przenieś na spód',
      o_fwd:'Przenieś wyżej', o_bwd:'Przenieś niżej',
      o_group:'Grupuj', o_ungroup:'Rozgrupuj',
      selMulti:'zaznaczonych obiektów',
      t_lake:'Jezioro', o_lake:'Jezioro', h_lake:'Kliknij, aby dodać punkty; od 3 punktów naciśnij Enter, aby zamknąć.', t_territory:'Terytorium', o_territory:'Terytorium', o_territorycolor:'Kolor wypełnienia', o_territorybcolor:'Kolor obramowania', h_territory:'Kliknij, aby dodać punkty; od 3 punktów naciśnij Enter, aby zamknąć.',
      o_lakecolor:'Kolor jeziora',
      o_symbbrush:'Tryb pędzla', o_symbdensity:'Gęstość', o_clipland:'Ogranicz do lądu (pędzel)',
      o_windrose:'Róża wiatrów', o_wrvis:'Pokaż na mapie', o_wrsize:'Rozmiar',
      o_wrstyle_classic:'Klasyczny', o_wrstyle_minimal:'Minimalistyczny', o_wrstyle:'Styl', o_wrcolor:'Kolor', h_windrose:'Przeciągnij na mapie, aby przesunąć.',
      o_snap:'Przyciągaj do siatki', o_snapsize:'Rozmiar siatki',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    ru: {
      new:'Новый', open:'Открыть', save:'Сохранить', parchment:'Пергамент', grid:'Сетка', shore:'Берег',
      t_select:'Выделение', t_landmass:'Суша', t_erase:'Море', t_terrain:'Местность', t_symbol:'Символ',
      t_river:'Река', t_road:'Дорога', t_label:'Надпись', t_pan:'Перемещение', t_eyedrop:'Пипетка',
      o_landmass:'Суша / Берег', o_brushsize:'Размер кисти', o_rough:'Неровность берега',
      o_landcolor:'Цвет суши', o_shorew:'Ширина берега', o_shorestyle:'Стиль берега', o_shore_sandy:'Песчаный', o_shore_rocky:'Скалистый', o_shore_reef:'Риф',
      o_smooth:'Сгладить берег', o_clearland:'Очистить сушу',
      h_landmass:'Перетаскивайте, чтобы рисовать сушу. Инструмент «Море» стирает и сушу, и местность.',
      o_terrain:'Рисование местности', o_opacity:'Непрозрачность', o_clip:'Рисовать только по суше',
      o_clearterrain:'Очистить слой местности',
      h_terrain:'Узоры при каждом мазке разбрасываются случайно — повторяющегося рисунка не будет.', t_elevation:'Высоты', o_elevation:'Рельеф', o_elevstrength:'Сила', o_elevlower:'Режим понижения', o_clearelevation:'Очистить рельеф', o_elevdisplay:'Отображение', o_elevhillshade:'Отмывка рельефа (hillshade)', o_elevcontours:'Горизонтали', o_contourinterval:'Шаг горизонталей', h_elevation:'Перетаскивайте, чтобы поднять рельеф; включите «Режим понижения», чтобы понизить его. Отмывка обновляется автоматически.',
      o_symbol:'Символ', o_size:'Размер', o_rot:'Поворот', o_hue:'Оттенок',
      o_wear:'Изношенность', o_jitter:'Случайное размещение',
      h_symbol:'Выберите символ из библиотеки, щёлкните по карте. «Выделение» — для перемещения; Delete — для удаления.',
      o_river:'Река', o_width:'Толщина', o_meander:'Извилистость',
      o_taper:'Сужать у истока', o_color:'Цвет',
      h_path:'Щёлкайте, чтобы добавить точки. Enter / двойной щелчок — завершить, Esc — отменить.',
      o_road:'Дорога / Караванный путь',
      o_label:'Надпись', o_preset:'Стиль оформления', o_curve:'Изгиб', o_track:'Межбуквенный интервал',
      h_label:'Выберите стиль, введите текст, щёлкните по карте. Изменения сразу применяются к выделенной надписи.',
      o_eyedrop:'Пипетка текстуры', o_eye_nosample:'Образец ещё не взят',
      o_eye_radius:'Радиус выборки', o_eye_brush:'Размер кисти',
      o_eye_pick:'① Выбрать область', o_eye_paint:'② Начать рисование', o_eye_clear:'Очистить образец',
      h_eyedrop:'① Выбрать область: растяните круг. ② Рисование: наносит взятую текстуру на карту.',
      eyeOk:'✓ Текстура взята', eyeFail:'Не удалось взять образец — попробуйте на суше/местности.',
      eyePick:'Щёлкните и потяните по карте → задайте размер круга → отпустите.',
      eyePaint:'Щёлкните и потяните по карте → текстура наносится.',
      eyeNeed:'Сначала возьмите образец через ① Выбрать область.',
      o_selection:'Выделение', o_nosel:'Ничего не выделено', o_dup:'Дублировать', o_del:'Удалить',
      o_scalebar:'Масштабная линейка', o_scvis:'Показывать на карте', o_sclen:'Длина',
      o_scsize:'Размер текста', o_scsegs:'Сегменты',
      h_scale:'Перетащите масштабную линейку по карте, чтобы переместить её.',
      o_view:'Вид', o_fit:'По размеру экрана', o_100:'100%',
      h_pan:'ПКМ + перетаскивание, СКМ, Пробел + перетаскивание или стрелки для перемещения.',
      tab_layers:'Слои', tab_library:'Библиотека', tab_history:'История',
      ref_title:'Референс-изображение', ref_export:'Включить в экспорт', ref_clear:'Убрать референс',
      sym_upload:'+ Загрузить PNG-символ', sym_upload_done:'символ(ов) загружено', sym_del:'Удалить', sym_search:'Поиск символов...',
      st_pos:'Позиция', st_zoom:'Масштаб', st_size:'Холст', st_tool:'Инструмент',
      cancel:'Отмена', ok:'ОК',
      locked:'Слой заблокирован или скрыт.', needtext:'Сначала введите текст надписи.',
      exported:'Экспортировано:', saved:'Проект сохранён.', loaded:'Проект загружен.',
      badfile:'Некорректный файл проекта.', newmap:'Создана новая карта.',
      confirmNew:'Текущая карта будет удалена. Выберите размер холста:',
      confirmSize:'Изменение размера холста масштабирует существующие слои. Продолжить?',
      histStart:'Начало', selNone:'Ничего не выделено', symbols:'символов',
      selScale:'Выделена масштабная линейка',
      o_zorder:'Порядок слоёв', o_front:'На передний план', o_back:'На задний план',
      o_fwd:'Переместить выше', o_bwd:'Переместить ниже',
      o_group:'Сгруппировать', o_ungroup:'Разгруппировать',
      selMulti:'объектов выделено',
      t_lake:'Озеро', o_lake:'Озеро', h_lake:'Щёлкайте, чтобы добавить точки; от 3 точек — Enter, чтобы замкнуть.', t_territory:'Территория', o_territory:'Территория', o_territorycolor:'Цвет заливки', o_territorybcolor:'Цвет границы', h_territory:'Щёлкайте, чтобы добавить точки; от 3 точек — Enter, чтобы замкнуть.',
      o_lakecolor:'Цвет озера',
      o_symbbrush:'Режим кисти', o_symbdensity:'Плотность', o_clipland:'Привязать к суше (кисть)',
      o_windrose:'Роза ветров', o_wrvis:'Показывать на карте', o_wrsize:'Размер',
      o_wrstyle_classic:'Классический', o_wrstyle_minimal:'Минималистичный', o_wrstyle:'Стиль', o_wrcolor:'Цвет', h_windrose:'Перетащите по карте, чтобы переместить.',
      o_snap:'Привязка к сетке', o_snapsize:'Размер сетки',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    }
  };

  var LANGS = [
    { code:'tr', flag:'🇹🇷', name:'Türkçe' },
    { code:'en', flag:'🇬🇧', name:'English' },
    { code:'de', flag:'🇩🇪', name:'Deutsch' },
    { code:'fr', flag:'🇫🇷', name:'Français' },
    { code:'es', flag:'🇪🇸', name:'Español' },
    { code:'it', flag:'🇮🇹', name:'Italiano' },
    { code:'pt', flag:'🇵🇹', name:'Português' },
    { code:'nl', flag:'🇳🇱', name:'Nederlands' },
    { code:'pl', flag:'🇵🇱', name:'Polski' },
    { code:'ru', flag:'🇷🇺', name:'Русский' }
  ];

  function $(id){ return document.getElementById(id); }
  function on(id, ev, fn){ var el = $(id); if (el) el.addEventListener(ev, fn); }

  var UI = {
    lang:'tr',
    editSnapshot:null,
    scaleSnapshot:null,
    msgTimer:0,

    t: function (k) { return (DICT[this.lang] && DICT[this.lang][k]) || DICT.tr[k] || k; },

    init: function () {
      this.buildTerrainSwatches();
      this.buildLabelPresets();
      this.buildSymbolLibrary();
      this.bindTopbar();
      this.bindTools();
      this.bindOptions();
      this.bindPanels();
      this.bindKeys();
      this.applyLang();
      this.refreshAll();
      this.setTool('landmass');
    },

    /* ================= dil ================= */
    applyLang: function () {
      var self = this;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = self.t(el.getAttribute('data-i18n'));
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        el.placeholder = self.t(el.getAttribute('data-i18n-placeholder'));
      });
      document.documentElement.lang = this.lang;
      this.buildTerrainSwatches();
      this.buildLabelPresets();
      this.buildSymbolLibrary();
      this.buildLangMenu();
      this.refreshLayers();
      this.refreshSelection();
      this.refreshHistory();
      this.status();
    },

    /* ================= üst toolbar ================= */
    bindTopbar: function () {
      var self = this;

      on('btn-new', 'click', function () {
        self.modal(self.t('new'),
          '<p>' + self.t('confirmNew') + '</p>' +
          '<select id="modal-size" class="sel"><option value="2048">2048 × 2048</option>' +
          '<option value="4096">4096 × 4096</option><option value="8192">8192 × 8192</option></select>',
          function () {
            var s = parseInt($('modal-size').value, 10) || 2048;
            $('sel-canvas-size').value = String(s);
            Exporter.newProject(s);
          });
      });

      on('btn-open', 'click', function () { $('file-open').click(); });
      on('file-open', 'change', function (e) {
        if (e.target.files && e.target.files[0]) Exporter.loadProject(e.target.files[0]);
        e.target.value = '';
      });
      on('btn-save', 'click', function () { Exporter.saveProject(); });
      on('btn-undo', 'click', function () { History.undo(); });
      on('btn-redo', 'click', function () { History.redo(); });
      on('btn-export-png', 'click', function () { Exporter.png(1); });
      on('btn-export-svg', 'click', function () { Exporter.svg(); });

      on('chk-shore', 'change', function (e) { Cv.shore = e.target.checked; Cv.requestRender(); });
      on('chk-parchment', 'change', function (e) { Cv.parchment = e.target.checked; Cv.requestRender(); });
      on('chk-grid', 'change', function (e) { Cv.grid = e.target.checked; Cv.requestRender(); });

      on('sel-canvas-size', 'change', function (e) {
        var s = parseInt(e.target.value, 10);
        if (confirm(self.t('confirmSize'))) {
          var ratio = s / Cv.W;
          Cv.setSize(s, s, true);
          /* Ölçek çubuğunu yeni canvas boyutuna oranla */
          App.scale.x   = Math.round(App.scale.x   * ratio);
          App.scale.y   = Math.round(App.scale.y   * ratio);
          App.scale.len = Math.round(App.scale.len  * ratio);
          App.scale.size= Math.round(App.scale.size * ratio);
          /* Windrose'u da oranla */
          App.windrose.x    = Math.round(App.windrose.x    * ratio);
          App.windrose.y    = Math.round(App.windrose.y    * ratio);
          App.windrose.size = Math.round(App.windrose.size * ratio);
          History.clear();
          self.refreshAll();
        } else e.target.value = String(Cv.W);
      });

      this.buildLangMenu();
      on('btn-lang', 'click', function (e) { e.stopPropagation(); self.toggleLangMenu(); });
      document.addEventListener('click', function () { self.closeLangMenu(); });
    },

    /* ================= dil menüsü ================= */
    buildLangMenu: function () {
      var menu = $('lang-menu');
      if (!menu) return;
      menu.innerHTML = '';
      var self = this;
      LANGS.forEach(function (l) {
        var li = document.createElement('li');
        li.className = 'lang-item' + (self.lang === l.code ? ' active' : '');
        var flag = document.createElement('span');
        flag.className = 'lang-flag';
        flag.textContent = l.flag;
        var name = document.createElement('span');
        name.className = 'lang-name';
        name.textContent = l.name;
        li.appendChild(flag); li.appendChild(name);
        li.addEventListener('click', function (e) {
          e.stopPropagation();
          if (self.lang === l.code) { self.closeLangMenu(); return; }
          self.lang = l.code;
          self.applyLang();
          self.closeLangMenu();
        });
        menu.appendChild(li);
      });
    },

    toggleLangMenu: function () {
      var menu = $('lang-menu');
      if (menu) menu.classList.toggle('hidden');
    },

    closeLangMenu: function () {
      var menu = $('lang-menu');
      if (menu) menu.classList.add('hidden');
    },

    /* ================= araç seçimi ================= */
    bindTools: function () {
      var self = this;
      document.querySelectorAll('.tool').forEach(function (b) {
        b.addEventListener('click', function () { self.setTool(b.getAttribute('data-tool')); });
      });
    },

    setTool: function (name) {
      var self = this;
      App.tool = name;
      Tools.cancelPath();
      document.querySelectorAll('.tool').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tool') === name);
      });
      document.querySelectorAll('.opt-group').forEach(function (g) {
        g.classList.toggle('show', g.getAttribute('data-for').split(' ').indexOf(name) >= 0);
      });
      /* aktif panelin i18n'ini güncelle */
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = self.t(el.getAttribute('data-i18n'));
      });
      Cv.view.className = (name === 'pan') ? 'pan' : (name === 'select' ? 'pick' : '');
      if (name === 'symbol') this.showTab('library');
      this.status();
      Cv.requestRender();
    },

    /* ================= kaydırıcı yardımcısı ================= */
    range: function (id, valId, fn, fmt) {
      var self = this, el = $(id);
      if (!el) return;
      el.addEventListener('pointerdown', function () { self.editStart(); });
      el.addEventListener('input', function () {
        var v = parseFloat(el.value);
        if (valId) $(valId).textContent = fmt ? fmt(v) : v;
        fn(v);
        Cv.requestRender();
      });
      el.addEventListener('change', function () { self.editCommit(); });
    },

    editStart: function () {
      if (this.editSnapshot || !App.selection) return;
      if (App.selection.layerId === 'scale') {
        this.scaleSnapshot = JSON.parse(JSON.stringify(App.scale));
        return;
      }
      var L = Layers.get(App.selection.layerId);
      if (!L) return;
      this.editSnapshot = { layerId:App.selection.layerId, arr:JSON.parse(JSON.stringify(L.objects)) };
    },

    editCommit: function () {
      if (this.scaleSnapshot) {
        History.pushScale(this.scaleSnapshot, JSON.parse(JSON.stringify(App.scale)), 'scale');
        this.scaleSnapshot = null;
        this.refreshHistory();
      }
      if (!this.editSnapshot) return;
      var s = this.editSnapshot;
      this.editSnapshot = null;
      if (!App.selection || App.selection.layerId !== s.layerId) return;
      Tools.commitSelectionEdit(s.arr, 'edit');
    },

    selIs: function (layerId) {
      return App.selection && App.selection.layerId === layerId;
    },

    /* ================= araç seçenekleri ================= */
    bindOptions: function () {
      var self = this;

      /* --- kara / deniz --- */
      this.range('lm-size', 'v-lm-size', function (v) { App.brush.size = v; });
      this.range('lm-rough', 'v-lm-rough', function (v) { App.brush.roughness = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('lm-color', 'input', function (e) { App.brush.color = e.target.value; });
      this.range('shore-w', 'v-shore-w', function (v) {
        Cv.shoreWidth = v; Cv.shoreDirty = true;
      });
      on('shore-style', 'change', function (e) {
        Cv.shoreStyle = e.target.value; Cv.shoreDirty = true; Cv.requestRender();
      });
      on('btn-smooth', 'click', function () { Tools.smoothCoast(6); });
      on('btn-clear-land', 'click', function () { Tools.clearRasterLayer('landmass'); });

      /* --- arazi --- */
      this.range('tr-size', 'v-tr-size', function (v) { App.terrain.size = v; });
      this.range('tr-op', 'v-tr-op', function (v) { App.terrain.opacity = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('tr-clip', 'change', function (e) { App.terrain.clip = e.target.checked; });
      on('btn-clear-terrain', 'click', function () { Tools.clearRasterLayer('terrain'); });

      /* --- yükselti --- */
      this.range('el-size', 'v-el-size', function (v) { App.elevation.brushSize = v; });
      this.range('el-strength', 'v-el-strength', function (v) { App.elevation.strength = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('el-lower', 'change', function (e) { App.elevation.lower = e.target.checked; });
      on('btn-clear-elevation', 'click', function () { Tools.clearRasterLayer('elevation'); });
      on('elev-hillshade', 'change', function (e) {
        App.elevation.showHillshade = e.target.checked;
        Cv.elevationDirty = true; Cv.requestRender();
      });
      on('elev-contours', 'change', function (e) {
        App.elevation.showContours = e.target.checked;
        Cv.elevationDirty = true; Cv.requestRender();
      });
      this.range('elev-interval', 'v-elev-interval', function (v) {
        App.elevation.contourInterval = v;
        Cv.elevationDirty = true;
      });

      /* --- sembol --- */
      this.range('sy-size', 'v-sy-size', function (v) {
        App.symbol.size = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ size:v });
      });
      this.range('sy-rot', 'v-sy-rot', function (v) {
        App.symbol.rot = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ rot:v });
      }, function (v) { return v + '°'; });
      this.range('sy-hue', 'v-sy-hue', function (v) {
        App.symbol.hue = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ hue:v });
      }, function (v) { return v + '°'; });
      this.range('sy-op', 'v-sy-op', function (v) {
        App.symbol.opacity = v/100;
        if (self.selIs('symbols')) Tools.applyToSelection({ opacity:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      this.range('sy-wear', 'v-sy-wear', function (v) {
        App.symbol.wear = v/100;
        if (self.selIs('symbols')) Tools.applyToSelection({ wear:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('sy-jitter', 'change', function (e) { App.symbol.jitter = e.target.checked; });

      /* --- nehir --- */
      this.range('rv-w', 'v-rv-w', function (v) {
        App.river.width = v;
        if (self.selIs('rivers')) Tools.applyToSelection({ width:v });
      });
      this.range('rv-m', 'v-rv-m', function (v) {
        App.river.meander = v/100;
        if (self.selIs('rivers')) Tools.applyToSelection({ meander:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('rv-taper', 'change', function (e) {
        App.river.taper = e.target.checked;
        self.editStart();
        if (self.selIs('rivers')) Tools.applyToSelection({ taper:e.target.checked });
        self.editCommit();
      });
      on('rv-color', 'input', function (e) {
        App.river.color = e.target.value;
        if (self.selIs('rivers')) Tools.applyToSelection({ color:e.target.value });
      });

      /* --- yol --- */
      on('rd-style', 'change', function (e) {
        App.road.style = e.target.value;
        self.editStart();
        if (self.selIs('roads')) Tools.applyToSelection({ style:e.target.value });
        self.editCommit();
      });
      this.range('rd-w', 'v-rd-w', function (v) {
        App.road.width = v;
        if (self.selIs('roads')) Tools.applyToSelection({ width:v });
      });
      on('rd-color', 'input', function (e) {
        App.road.color = e.target.value;
        if (self.selIs('roads')) Tools.applyToSelection({ color:e.target.value });
      });

      /* --- etiket --- */
      function labelEdit(props) { if (self.selIs('labels')) Tools.applyToSelection(props); }

      on('lb-text', 'input', function (e) {
        labelEdit({ text:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });

      on('lb-preset', 'change', function (e) {
        self.applyPreset(e.target.value);
        self.editStart();
        if (self.selIs('labels')) {
          var p = LABEL_PRESETS[e.target.value];
          Tools.applyToSelection({
            preset:e.target.value, font:p.font, color:p.color, outline:p.outline,
            outlineColor:p.outlineColor, shadow:p.shadow, track:p.track,
            caps:p.caps, banner:p.banner, size:p.size
          });
        }
        self.editCommit();
        self.drawLabelPreview();
        Cv.requestRender();
      });

      this.range('lb-size', 'v-lb-size', function (v) { App.label.size = v; labelEdit({ size:v }); self.drawLabelPreview(); });
      this.range('lb-curve', 'v-lb-curve', function (v) { App.label.curve = v; labelEdit({ curve:v }); });
      this.range('lb-track', 'v-lb-track', function (v) { App.label.track = v; labelEdit({ track:v }); self.drawLabelPreview(); });
      this.range('lb-rot', 'v-lb-rot', function (v) { App.label.rot = v; labelEdit({ rot:v }); },
                 function (v) { return v + '°'; });
      on('lb-color', 'input', function (e) {
        App.label.color = e.target.value;
        labelEdit({ color:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });

      /* --- örnekleyici --- */
      on('eye-r', 'input', function (e) {
        App.eyedrop.radius = parseFloat(e.target.value);
        $('v-eye-r').textContent = e.target.value;
      });
      on('eye-br', 'input', function (e) {
        App.eyedrop.brushRadius = parseFloat(e.target.value);
        $('v-eye-br').textContent = e.target.value;
        Cv.requestRender();
      });
      on('eye-layer', 'change', function (e) { App.eyedrop.targetLayer = e.target.value; });
      on('btn-eye-pick', 'click', function () {
        Eyedropper.active = false; Eyedropper.sample = null; Eyedropper.picking = false;
        App.eyedrop.hasSample = false; App.eyedrop.painting = false;
        self.setTool('eyedrop');
        self.refreshEyedropPanel();
        self.msg(self.t('eyePick'));
      });
      on('btn-eye-paint', 'click', function () {
        if (!Eyedropper.sample) { self.msg(self.t('eyeNeed')); return; }
        App.eyedrop.painting = true;
        App.eyedrop.hasSample = true;
        self.setTool('eyedrop');
        self.refreshEyedropPanel();
        self.msg(self.t('eyePaint'));
      });
      on('btn-eye-clear', 'click', function () {
        Eyedropper.sample = null; Eyedropper.active = false;
        App.eyedrop.hasSample = false; App.eyedrop.painting = false;
        self.refreshEyedropPanel();
        Cv.requestRender();
      });

      /* --- seçim --- */
      on('btn-del', 'click', function () { Tools.deleteSelection(); });
      on('btn-dup', 'click', function () { Tools.duplicateSelection(); });

      /* --- ölçek çubuğu --- */
      on('sc-visible', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.scale));
        App.scale.visible = e.target.checked;
        History.pushScale(b, JSON.parse(JSON.stringify(App.scale)), 'scale:visible');
        self.refreshHistory();
        Cv.requestRender();
      });
      on('sc-label', 'input', function (e) { App.scale.label = e.target.value; Cv.requestRender(); });
      on('sc-label', 'change', function () {
        History.pushScale(App.scale, JSON.parse(JSON.stringify(App.scale)), 'scale:label');
        self.refreshHistory();
      });
      this.range('sc-len', 'v-sc-len', function (v) { App.scale.len = v; });
      this.range('sc-size', 'v-sc-size', function (v) { App.scale.size = v; });
      this.range('sc-segs', 'v-sc-segs', function (v) { App.scale.segs = Math.round(v); });

      /* --- sembol fırçası --- */
      on('sy-brush-mode', 'change', function (e) { App.symbol.brushMode = e.target.checked; });
      self.range('sy-brush-density', 'v-sy-br-den', function (v) { App.symbol.brushDensity = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('sy-clip-land', 'change', function (e) { App.symbol.clipToLand = e.target.checked; });

      /* --- göl --- */
      on('lk-color', 'input', function (e) {
        App.lake.color = e.target.value;
        if (self.selIs('rivers') && Tools.selected() && Tools.selected().kind === 'lake') {
          Tools.applyToSelection({ color:e.target.value });
        }
      });

      /* --- bölge/toprak --- */
      function terrEdit(props) { if (self.selIs('territories')) Tools.applyToSelection(props); }
      on('tt-color', 'input', function (e) {
        App.territory.color = e.target.value;
        terrEdit({ color:e.target.value });
      });
      this.range('tt-op', 'v-tt-op', function (v) {
        App.territory.opacity = v/100;
        terrEdit({ opacity:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('tt-bcolor', 'input', function (e) {
        App.territory.borderColor = e.target.value;
        terrEdit({ borderColor:e.target.value });
      });
      this.range('tt-bw', 'v-tt-bw', function (v) {
        App.territory.borderWidth = v;
        terrEdit({ borderWidth:v });
      });

      /* --- windrose --- */
      on('wr-visible', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.windrose));
        App.windrose.visible = e.target.checked;
        History.pushWindrose(b, JSON.parse(JSON.stringify(App.windrose)), 'windrose:visible');
        self.refreshHistory(); Cv.requestRender();
      });
      self.range('wr-size', 'v-wr-size', function (v) { App.windrose.size = v; });
      on('wr-style', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.windrose));
        App.windrose.style = e.target.value;
        History.pushWindrose(b, JSON.parse(JSON.stringify(App.windrose)), 'windrose:style');
        self.refreshHistory(); Cv.requestRender();
      });
      on('wr-color', 'input', function (e) { App.windrose.color = e.target.value; Cv.requestRender(); });

      /* --- snap --- */
      on('snap-enabled', 'change', function (e) { App.snap.enabled = e.target.checked; });
      self.range('snap-size', 'v-snap-size', function (v) { App.snap.size = Math.round(v); });

      /* --- PNG export ölçeği --- */
      on('btn-export-png2', 'click', function () { Exporter.png(2); });
      on('btn-export-png4', 'click', function () { Exporter.png(4); });

      /* --- görünüm --- */
      on('btn-fit', 'click', function () { Cv.fit(); });
      on('btn-100', 'click', function () { Cv.setZoom(1); });

      /* --- referans --- */
      on('ref-file', 'change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var im = new Image();
          im.onload = function () {
            var L = Layers.get('reference');
            L.image = im; L.imageData = r.result; L.visible = true;
            self.refreshLayers();
            Cv.requestRender();
          };
          im.src = r.result;
        };
        r.readAsDataURL(f);
        e.target.value = '';
      });
      on('ref-export', 'change', function (e) { App.exportReference = e.target.checked; });
      on('btn-ref-clear', 'click', function () {
        var L = Layers.get('reference');
        L.image = null; L.imageData = null;
        Cv.requestRender();
      });

      /* --- custom PNG sembol --- */
      on('btn-sym-upload', 'click', function () { $('sym-file').click(); });
      on('sym-file', 'change', function (e) {
        var files = e.target.files;
        if (!files || !files.length) return;
        var loaded = 0, total = files.length;
        Array.prototype.forEach.call(files, function (f) {
          var r = new FileReader();
          r.onload = function () {
            var im = new Image();
            im.onload = function () {
              var id = 'cus_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
              Sym.addCustom(id, f.name.replace(/\.[^.]+$/, ''), r.result, im.naturalWidth, im.naturalHeight);
              loaded++;
              if (loaded === total) {
                self.renderCustomSymGrid();
                self.msg(total + ' ' + self.t('sym_upload_done'));
              }
            };
            im.src = r.result;
          };
          r.readAsDataURL(f);
        });
        e.target.value = '';
      });
    },

    /* ================= etiket şablonları ================= */
    buildLabelPresets: function () {
      var sel = $('lb-preset');
      if (!sel) return;
      var cur = sel.value || App.label.preset;
      sel.innerHTML = '';
      var self = this;
      Object.keys(LABEL_PRESETS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = i18nName(k, LABEL_PRESETS[k].tr, LABEL_PRESETS[k].en, self.lang);
        sel.appendChild(o);
      });
      sel.value = LABEL_PRESETS[cur] ? cur : 'region';
      this.drawLabelPreview();
    },

    applyPreset: function (key) {
      var p = LABEL_PRESETS[key];
      if (!p) return;
      App.label.preset = key;
      App.label.font = p.font;
      App.label.size = p.size;
      App.label.color = p.color;
      App.label.outline = p.outline;
      App.label.outlineColor = p.outlineColor;
      App.label.shadow = p.shadow;
      App.label.track = p.track;
      App.label.caps = p.caps;
      App.label.banner = p.banner;
      $('lb-size').value = p.size;   $('v-lb-size').textContent = p.size;
      $('lb-track').value = p.track; $('v-lb-track').textContent = p.track;
      $('lb-color').value = p.color;
    },

    drawLabelPreview: function () {
      var c = $('lb-preview');
      if (!c) return;
      var x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = '#cdbf9c';
      x.fillRect(0, 0, c.width, c.height);

      var txt = ($('lb-text') && $('lb-text').value.trim()) || 'Sideria';
      var o = {
        text:txt, x:c.width/2, y:c.height/2, font:App.label.font,
        size:20, color:App.label.color, outline:App.label.outline,
        outlineColor:App.label.outlineColor, shadow:App.label.shadow,
        curve:0, track:Math.min(6, App.label.track), rot:0,
        caps:App.label.caps, banner:App.label.banner, opacity:1
      };
      /* önizleme genişliğe sığsın */
      var save = Cv.ctx;
      Cv.ctx = x;
      var w = Cv.measureLabel(x, o);
      var maxW = c.width - (o.banner ? 46 : 16);
      if (w > maxW) o.size = Math.max(8, 20 * maxW / w);
      Cv.drawLabel(x, o);
      Cv.ctx = save;
    },

    /* ================= sağ panel ================= */
    bindPanels: function () {
      var self = this;
      document.querySelectorAll('.tab').forEach(function (t) {
        t.addEventListener('click', function () { self.showTab(t.getAttribute('data-tab')); });
      });
      on('sym-cat', 'change', function () { $('sym-search').value = ''; self.renderSymbolGrid(); });
      on('sym-search', 'input', function () { self.renderSymbolGrid(); });
    },

    showTab: function (name) {
      document.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === name);
      });
      document.querySelectorAll('.tab-body').forEach(function (b) {
        b.classList.toggle('hidden', b.getAttribute('data-tab') !== name);
      });
    },

    /* ================= arazi paleti ================= */
    buildTerrainSwatches: function () {
      var g = $('terrain-grid');
      if (!g) return;
      g.innerHTML = '';
      var self = this;
      Object.keys(Terrain.TERRAIN).forEach(function (key) {
        var t = Terrain.TERRAIN[key];
        var b = document.createElement('button');
        b.className = 'terrain-sw' + (App.terrain.type === key ? ' active' : '');
        var c = document.createElement('canvas');
        c.width = 90; c.height = 34;
        c.getContext('2d').drawImage(Terrain.swatch(key, 90, 34), 0, 0);
        b.appendChild(c);
        var s = document.createElement('span');
        s.textContent = i18nName(key, t.tr, t.en, self.lang);
        b.appendChild(s);
        b.addEventListener('click', function () {
          App.terrain.type = key;
          g.querySelectorAll('.terrain-sw').forEach(function (e) { e.classList.remove('active'); });
          b.classList.add('active');
          self.setTool('terrain');
        });
        g.appendChild(b);
      });
    },

    /* ================= sembol kütüphanesi ================= */
    buildSymbolLibrary: function () {
      var sel = $('sym-cat');
      if (!sel) return;
      var cur = sel.value;
      sel.innerHTML = '';
      var self = this;
      Object.keys(Sym.SYMBOLS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = i18nName(k, Sym.SYMBOLS[k].tr, Sym.SYMBOLS[k].en, self.lang) +
                        ' (' + Sym.SYMBOLS[k].items.length + ')';
        sel.appendChild(o);
      });
      sel.value = cur && Sym.SYMBOLS[cur] ? cur : 'castles';
      this.renderSymbolGrid();
    },

    makeSymCell: function (grid, def) {
      var self = this;
      var cell = document.createElement('div');
      cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
      var c = document.createElement('canvas');
      c.width = 96; c.height = 96;
      Sym.draw(c.getContext('2d'), def.id, { x:48, y:48, size:86, rot:0, hue:0, opacity:1 });
      cell.appendChild(c);
      var s = document.createElement('small');
      s.textContent = i18nName(def.id, def.tr, def.en, self.lang);
      cell.appendChild(s);
      cell.addEventListener('click', function () {
        App.symbol.id = def.id;
        grid.querySelectorAll('.sym-cell').forEach(function (e) { e.classList.remove('active'); });
        document.querySelectorAll('#custom-sym-grid .sym-cell').forEach(function (e) { e.classList.remove('active'); });
        cell.classList.add('active');
        self.setTool('symbol');
      });
      return cell;
    },

    renderSymbolGrid: function () {
      var grid = $('sym-grid');
      if (!grid) return;
      var self = this;
      var q = ($('sym-search') && $('sym-search').value || '').trim().toLocaleLowerCase(this.lang);
      grid.innerHTML = '';

      if (q) {
        /* arama modu: tüm kategorilerde adı eşleşen sembolleri düz liste olarak göster */
        Object.keys(Sym.SYMBOLS).forEach(function (cat) {
          Sym.SYMBOLS[cat].items.forEach(function (def) {
            var name = i18nName(def.id, def.tr, def.en, self.lang);
            if (name.toLocaleLowerCase(self.lang).indexOf(q) >= 0) {
              grid.appendChild(self.makeSymCell(grid, def));
            }
          });
        });
        return;
      }

      var cat = $('sym-cat') && $('sym-cat').value;
      if (!Sym.SYMBOLS[cat]) return;
      Sym.SYMBOLS[cat].items.forEach(function (def) {
        grid.appendChild(self.makeSymCell(grid, def));
      });
    },

    renderCustomSymGrid: function () {
      var g = $('custom-sym-grid');
      if (!g) return;
      g.innerHTML = '';
      var self = this;
      var customs = Sym.getCustomAll();
      if (!customs.length) { g.style.display = 'none'; return; }
      g.style.display = 'grid';
      customs.forEach(function (def) {
        var cell = document.createElement('div');
        cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
        cell.style.position = 'relative';
        var cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        Sym.loadImg(def.dataURL, function (im) {
          if (!im) return;
          var x = cv.getContext('2d');
          x.clearRect(0, 0, 96, 96);
          x.drawImage(im, 0, 0, 96, 96);
        });
        cell.appendChild(cv);
        var s = document.createElement('small');
        s.textContent = def.tr;
        cell.appendChild(s);
        var del = document.createElement('button');
        del.className = 'sym-del';
        del.textContent = '✕';
        del.title = self.t('sym_del');
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          Sym.removeCustom(def.id);
          if (App.symbol.id === def.id) App.symbol.id = 'ik_knight';
          self.renderCustomSymGrid();
        });
        cell.appendChild(del);
        cell.addEventListener('click', function () {
          App.symbol.id = def.id;
          document.querySelectorAll('.sym-cell').forEach(function (e) { e.classList.remove('active'); });
          cell.classList.add('active');
          self.setTool('symbol');
        });
        g.appendChild(cell);
      });
    },

    /* ================= katman listesi ================= */
    refreshLayers: function () {
      var ul = $('layer-list');
      if (!ul) return;
      ul.innerHTML = '';
      var self = this;
      var order = Layers.list.slice().reverse();

      order.forEach(function (l) {
        var li = document.createElement('li');
        li.className = 'layer-item' + (Layers.active === l.id ? ' active' : '');
        li.draggable = true;
        li.setAttribute('data-id', l.id);

        var top = document.createElement('div');
        top.className = 'layer-top';

        var vis = document.createElement('button');
        vis.className = 'li-btn' + (l.visible ? '' : ' off');
        vis.textContent = l.visible ? '◉' : '○';
        vis.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.visible = !l.visible;
          if (l.id === 'landmass') Cv.shoreDirty = true;
          History.pushMeta(before, Layers.meta(), 'visibility');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        var lock = document.createElement('button');
        lock.className = 'li-btn' + (l.locked ? '' : ' off');
        lock.textContent = l.locked ? '🔒' : '🔓';
        lock.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.locked = !l.locked;
          History.pushMeta(before, Layers.meta(), 'lock');
          self.refreshLayers(); self.refreshHistory();
        });

        var name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = Layers.name(l, self.lang);

        top.appendChild(vis); top.appendChild(lock); top.appendChild(name);
        li.appendChild(top);

        var op = document.createElement('input');
        op.type = 'range'; op.className = 'layer-op';
        op.min = 0; op.max = 100; op.value = Math.round(l.opacity * 100);
        var metaBefore = null;
        op.addEventListener('pointerdown', function () { metaBefore = Layers.meta(); });
        op.addEventListener('input', function () { l.opacity = op.value/100; Cv.requestRender(); });
        op.addEventListener('change', function () {
          if (metaBefore) History.pushMeta(metaBefore, Layers.meta(), 'opacity');
          metaBefore = null;
          self.refreshHistory();
        });
        li.appendChild(op);

        li.addEventListener('click', function () { Layers.active = l.id; self.refreshLayers(); });

        li.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', l.id);
          e.dataTransfer.effectAllowed = 'move';
        });
        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('drag-over'); });
        li.addEventListener('drop', function (e) {
          e.preventDefault();
          li.classList.remove('drag-over');
          var src = e.dataTransfer.getData('text/plain');
          if (!src || src === l.id) return;
          var before = Layers.meta();
          Layers.move(Layers.indexOf(src), Layers.indexOf(l.id));
          History.pushMeta(before, Layers.meta(), 'reorder');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        ul.appendChild(li);
      });
    },

    /* ================= geçmiş ================= */
    refreshHistory: function () {
      var ul = $('history-list');
      if (!ul) return;
      ul.innerHTML = '';

      var li0 = document.createElement('li');
      li0.textContent = '· ' + this.t('histStart');
      li0.className = History.index === -1 ? 'cur' : '';
      li0.addEventListener('click', function () { History.goto(-1); });
      ul.appendChild(li0);

      History.stack.forEach(function (e, i) {
        var li = document.createElement('li');
        li.textContent = (i+1) + '. ' + e.label;
        li.className = i === History.index ? 'cur' : (i > History.index ? 'future' : '');
        li.addEventListener('click', function () { History.goto(i); });
        ul.appendChild(li);
      });

      if ($('btn-undo')) $('btn-undo').disabled = !History.canUndo();
      if ($('btn-redo')) $('btn-redo').disabled = !History.canRedo();
    },

    /* ================= seçim paneli ================= */
    refreshSelection: function () {
      var box = $('sel-info');
      if (!box) return;

      /* z-order butonlarını güster/gizle */
      var isMulti = App.selection && App.selection.multi;
      var isSingle = App.selection && !App.selection.multi && App.selection.layerId !== 'scale';
      var isGroup = isSingle && Tools.selected() && Tools.selected().kind === 'group';
      if ($('btn-front')) $('btn-front').style.display = isSingle ? '' : 'none';
      if ($('btn-back'))  $('btn-back').style.display  = isSingle ? '' : 'none';
      if ($('btn-fwd'))   $('btn-fwd').style.display   = isSingle ? '' : 'none';
      if ($('btn-bwd'))   $('btn-bwd').style.display   = isSingle ? '' : 'none';
      if ($('btn-group'))   $('btn-group').style.display   = isMulti ? '' : 'none';
      if ($('btn-ungroup')) $('btn-ungroup').style.display = isGroup ? '' : 'none';

      if (App.selection && App.selection.layerId === 'scale') {
        box.textContent = this.t('selScale');
        Cv.requestRender();
        return;
      }

      /* multi seçim */
      if (App.selection && App.selection.multi) {
        box.textContent = App.selection.ids.length + ' ' + this.t('selMulti');
        Cv.requestRender();
        return;
      }

      var o = Tools.selected();
      if (!o) { box.textContent = this.t('selNone'); Cv.requestRender(); return; }

      var kind = App.selection.layerId, desc = kind;
      if (kind === 'symbols') desc += ' · ' + o.sym + ' · ' + Math.round(o.size) + 'px';
      else if (kind === 'labels') desc += ' · "' + (o.text||'').slice(0,18) + '"';
      else desc += ' · ' + o.pts.length + ' pt';
      box.textContent = desc;

      if (kind === 'symbols') {
        $('sy-size').value = o.size;  $('v-sy-size').textContent = Math.round(o.size);
        $('sy-rot').value = o.rot;    $('v-sy-rot').textContent = Math.round(o.rot)+'°';
        $('sy-hue').value = o.hue;    $('v-sy-hue').textContent = Math.round(o.hue)+'°';
        $('sy-op').value = Math.round(o.opacity*100);
        $('v-sy-op').textContent = o.opacity.toFixed(2);
        $('sy-wear').value = Math.round((o.wear||0)*100);
        $('v-sy-wear').textContent = (o.wear||0).toFixed(2);
      } else if (kind === 'labels') {
        $('lb-text').value = o.text;
        if (o.preset && LABEL_PRESETS[o.preset]) $('lb-preset').value = o.preset;
        $('lb-size').value = o.size;    $('v-lb-size').textContent = o.size;
        $('lb-curve').value = o.curve;  $('v-lb-curve').textContent = o.curve;
        $('lb-track').value = o.track;  $('v-lb-track').textContent = o.track;
        $('lb-rot').value = o.rot;      $('v-lb-rot').textContent = o.rot+'°';
        $('lb-color').value = o.color;
      } else if (kind === 'rivers' && o.kind === 'lake') {
        $('lk-color').value = o.color;
      } else if (kind === 'rivers') {
        $('rv-w').value = o.width;  $('v-rv-w').textContent = o.width;
        $('rv-m').value = Math.round(o.meander*100);
        $('v-rv-m').textContent = o.meander.toFixed(2);
      } else if (kind === 'roads') {
        $('rd-w').value = o.width;  $('v-rd-w').textContent = o.width;
        $('rd-style').value = o.style;
      } else if (kind === 'territories') {
        $('tt-color').value = o.color;
        $('tt-op').value = Math.round((o.opacity===undefined?0.30:o.opacity)*100);
        $('v-tt-op').textContent = (o.opacity===undefined?0.30:o.opacity).toFixed(2);
        $('tt-bcolor').value = o.borderColor;
        $('tt-bw').value = o.borderWidth; $('v-tt-bw').textContent = o.borderWidth;
      }
      Cv.requestRender();
    },

    refreshScalePanel: function () {
      if (!$('sc-len')) return;
      $('sc-visible').checked = App.scale.visible;
      $('sc-label').value = App.scale.label;
      $('sc-len').value = App.scale.len;   $('v-sc-len').textContent = Math.round(App.scale.len);
      $('sc-size').value = App.scale.size; $('v-sc-size').textContent = App.scale.size;
      $('sc-segs').value = App.scale.segs; $('v-sc-segs').textContent = App.scale.segs;
    },

    refreshEyedropPanel: function () {
      var el = $('eyedrop-status');
      if (!el) return;
      var s = Eyedropper.sample;
      if (!s) {
        el.textContent = this.t('o_eye_nosample');
        el.style.color = '';
        if ($('btn-eye-paint')) $('btn-eye-paint').disabled = true;
        return;
      }
      el.textContent = (App.eyedrop.painting ? '🖌 ' : '✓ ') +
                       'r=' + Math.round(s.radius) + ' · ' + s.edges.length + ' · ' + s.baseColor;
      el.style.color = App.eyedrop.painting ? '#6f9a63' : '#c99a4b';
      if ($('btn-eye-paint')) $('btn-eye-paint').disabled = false;
    },

    refreshAll: function () {
      this.refreshLayers();
      this.refreshHistory();
      this.refreshSelection();
      this.refreshScalePanel();
      this.refreshWindrosePanel();
      this.refreshEyedropPanel();
      this.renderCustomSymGrid();
      this.status();
    },

    refreshWindrosePanel: function () {
      if (!$('wr-size')) return;
      $('wr-visible').checked = App.windrose.visible;
      $('wr-size').value = App.windrose.size; $('v-wr-size').textContent = App.windrose.size;
      if ($('wr-style')) $('wr-style').value = App.windrose.style || 'classic';
      $('wr-color').value = App.windrose.color || '#3a2b18';
    },

    /* ================= durum çubuğu ================= */
    status: function () {
      var p = $('st-pos'), z = $('st-zoom'), s = $('st-size'), t = $('st-tool');
      if (p) p.textContent = Math.round(Cv.mouse.x) + ', ' + Math.round(Cv.mouse.y);
      if (z) z.textContent = Math.round(Cv.zoom*100) + '%';
      if (s) s.textContent = Cv.W + ' × ' + Cv.H;
      if (t) t.textContent = this.t('t_' + App.tool);
    },

    msg: function (text) {
      var el = $('st-msg');
      if (!el) return;
      el.textContent = text;
      clearTimeout(this.msgTimer);
      this.msgTimer = setTimeout(function () { el.textContent = ''; }, 3600);
    },

    /* ================= modal ================= */
    modal: function (title, bodyHTML, onOk) {
      $('modal-title').textContent = title;
      $('modal-body').innerHTML = bodyHTML;
      var m = $('modal');
      m.classList.remove('hidden');
      function close() {
        m.classList.add('hidden');
        $('modal-ok').removeEventListener('click', ok);
        $('modal-cancel').removeEventListener('click', close);
      }
      function ok() { if (onOk) onOk(); close(); }
      $('modal-ok').addEventListener('click', ok);
      $('modal-cancel').addEventListener('click', close);
    },

    /* ================= klavye ================= */
    bindKeys: function () {
      var self = this;
      var map = { v:'select', b:'landmass', e:'erase', t:'terrain', s:'symbol',
                  r:'river', d:'road', l:'label', h:'pan', i:'eyedrop', k:'lake', g:'territory',
                  u:'elevation' };

      window.addEventListener('keydown', function (ev) {
        var tag = (ev.target.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || tag === 'select';

        if (ev.code === 'Space' && !typing) {
          Tools.spaceDown = true;
          Cv.view.classList.add('pan');
          ev.preventDefault();
          return;
        }

        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
          ev.preventDefault();
          if (ev.shiftKey) History.redo(); else History.undo();
          return;
        }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') { ev.preventDefault(); History.redo(); return; }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); Exporter.saveProject(); return; }
        if (typing) return;

        /* yön tuşları ile kaydırma */
        var step = ev.shiftKey ? 220 : 70;
        if (ev.key === 'ArrowLeft')  { ev.preventDefault(); Cv.panBy( step, 0); return; }
        if (ev.key === 'ArrowRight') { ev.preventDefault(); Cv.panBy(-step, 0); return; }
        if (ev.key === 'ArrowUp')    { ev.preventDefault(); Cv.panBy(0,  step); return; }
        if (ev.key === 'ArrowDown')  { ev.preventDefault(); Cv.panBy(0, -step); return; }

        if (ev.key === 'Enter') { Tools.finishPath(); return; }
        if (ev.key === 'Escape') { Tools.cancelPath(); App.selection = null; self.refreshSelection(); return; }
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
          if (!Tools.undoPathPoint()) Tools.deleteSelection();
          return;
        }
        if (ev.key === '+' || ev.key === '=') { Cv.setZoom(Cv.zoom*1.15); return; }
        if (ev.key === '-') { Cv.setZoom(Cv.zoom/1.15); return; }
        if (ev.key === '0') { Cv.fit(); return; }
        /* sembol döndürme */
        if (ev.key === '[') {
          App.symbol.rot = (App.symbol.rot - 15 + 360) % 360;
          if ($('sy-rot')) { $('sy-rot').value = App.symbol.rot; $('v-sy-rot').textContent = Math.round(App.symbol.rot) + '°'; }
          if (self.selIs('symbols')) Tools.applyToSelection({ rot: App.symbol.rot });
          Cv.requestRender(); return;
        }
        if (ev.key === ']') {
          App.symbol.rot = (App.symbol.rot + 15) % 360;
          if ($('sy-rot')) { $('sy-rot').value = App.symbol.rot; $('v-sy-rot').textContent = Math.round(App.symbol.rot) + '°'; }
          if (self.selIs('symbols')) Tools.applyToSelection({ rot: App.symbol.rot });
          Cv.requestRender(); return;
        }
        if (map[ev.key.toLowerCase()]) self.setTool(map[ev.key.toLowerCase()]);
      });

      window.addEventListener('keyup', function (ev) {
        if (ev.code === 'Space') {
          Tools.spaceDown = false;
          if (App.tool !== 'pan') Cv.view.classList.remove('pan');
        }
      });
    }
  };

  global.UI = UI;
})(window);
